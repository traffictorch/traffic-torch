export default {
  async fetch(request, env, ctx) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: cors });
    }

    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405, headers: cors });
    }

    let body;
    try { body = await request.json(); } catch { 
      return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: cors });
    }

    const mode = String(body.mode || 'both');
    const metrics = body.payload?.metrics || {};
    const url = body.payload?.url || 'unknown';
    const score = body.payload?.score != null ? body.payload.score : 'n/a';

    const modeInstruction = {
      both: 'Improve both organic click-through/dwell and AI citation-worthiness.',
      seo: 'Focus on organic search click-through and dwell-time incentives.',
      aeo: 'Focus on answerability, definitional clarity, lists, sourced statistics, and citation-worthiness.'
    }[mode] || 'Improve overall incentive design.';

    const compact = Object.entries(metrics).map(function(kv) {
      const k = kv[0], v = kv[1];
      return k + ': score=' + v.score + ', detail=' + (v.detail || '') + ', evidence=' + ((v.evidence || []).join('; '));
    }).join('\n');

    const sysPrompt = 'You are a senior UX and conversion strategist. ' + modeInstruction +
      '\nReturn ONLY valid JSON: {"fixes":[{"title":"...","what":"...","why":"...","impact":"..."}]}.\nGenerate 3 to 4 distinct fixes focusing on the metrics with the lowest scores. Each string MUST be under 20 words. No generic advice.';

    const userPrompt = 'URL: ' + url + '\nOverall UXID score: ' + score + '\nMode: ' + mode + '\n\nDeterministic signals:\n' + compact;

    try {
      const ai = await env.AI.run('@cf/meta/llama-3.1-8b-instruct-fast', {
        messages: [
          { role: 'system', content: sysPrompt },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 1400,
        temperature: 0.4
      });

      let rawText = '';
      try {
        if (typeof ai === 'string') rawText = ai;
        else if (ai && typeof ai.response === 'string') rawText = ai.response;
        else if (ai && ai.choices && ai.choices[0] && ai.choices[0].message) rawText = ai.choices[0].message.content;
        else if (ai && typeof ai.result === 'string') rawText = ai.result;
        else rawText = JSON.stringify(ai);
      } catch (e) { rawText = ''; }

      let parsed = null;
      let cleanText = rawText.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
      const start = cleanText.indexOf('{');
      const end = cleanText.lastIndexOf('}');
      if (start !== -1 && end !== -1) cleanText = cleanText.slice(start, end + 1);
      cleanText = cleanText.replace(/,\s*\}/g, '}').replace(/,\s*\]/g, ']');

      try { parsed = JSON.parse(cleanText); } catch (e) {}

      if (!parsed || !parsed.fixes) {
        const objectMatches = cleanText.match(/\{\s*"title"[\s\S]*?\}/g);
        if (objectMatches && objectMatches.length > 0) {
          let extractedFixes = [];
          for (let match of objectMatches) {
            try {
              const obj = JSON.parse(match);
              if (obj.title && obj.what) extractedFixes.push(obj);
            } catch (e) {}
          }
          if (extractedFixes.length > 0) parsed = { fixes: extractedFixes };
        }
      }

      if (!parsed || !parsed.fixes || parsed.fixes.length === 0) {
        parsed = { fixes: [{ title: 'AI recommendation (unstructured)', what: cleanText.slice(0, 1500), why: 'Model returned invalid JSON. Displaying raw output.', impact: '' }] };
      }

      return new Response(JSON.stringify(parsed), {
        status: 200,
        headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
      });
    } catch (e) {
      return new Response(JSON.stringify({ error: e.message || 'uxid-fix failed' }), {
        status: 500,
        headers: Object.assign({ 'Content-Type': 'application/json' }, cors)
      });
    }
  }
};
