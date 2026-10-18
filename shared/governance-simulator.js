/**
 * Governance Simulator — renderer v2 (Mission Control)
 *
 * Usage:
 *   GovernanceSimulator.init(element, {
 *     mode: 'full',        // 'full' | 'compact' | 'sandbox'
 *     brand: 'Traffic Torch',
 *     brandColor: '#ff8a3d',
 *     autoplay: true       // compact mode forces autoplay=false
 *   });
 *
 * Depends on:
 *   window.GovernanceRules  (shared/governance-rules.js)
 *   window.GOVERNANCE_SIM_SCENARIOS  (shared/governance-scenarios.js)
 */

(function (global) {
  'use strict';

  var R = function () { return global.GovernanceRules; };
  var SIM_API = 'https://traffic-torch-auth.traffictorch.workers.dev';
  var CONFIG_TIMEOUT_MS = 1500;

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      if (k === 'class') node.className = attrs[k];
      else if (k === 'text') node.textContent = attrs[k];
      else if (k === 'html') node.innerHTML = attrs[k];
      else if (k.slice(0, 2) === 'on') node.addEventListener(k.slice(2), attrs[k]);
      else if (k.slice(0, 5) === 'data-') node.setAttribute(k, attrs[k]);
      else if (k === 'style') node.style.cssText = attrs[k];
      else node.setAttribute(k, attrs[k]);
    }
    (children || []).forEach(function (c) {
      node.appendChild(typeof c === 'string' ? document.createTextNode(c) : c);
    });
    return node;
  }

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pct(n, total) { return total ? Math.round((n / total) * 100) : 0; }

  function Simulator(container, config) {
    this.container = container;
    this.config = Object.assign({
      mode: 'full',
      brand: 'Governance Simulator',
      brandColor: '#ff8a3d',
      autoplay: true
    }, config || {});

    if (this.config.mode === 'compact') this.config.autoplay = false;

    this.reduceMotion = window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.scenarios = (global.GOVERNANCE_SIM_SCENARIOS || []);
    if (!this.scenarios.length) {
      container.innerHTML = '<div class="gs-error">No scenarios loaded. Include shared/governance-scenarios.js.</div>';
      return;
    }

    this.scenarioIndex = 0;
    this.currentT = 0;
    this.isPlaying = false;
    this.speed = 1;
    this.raf = null;
    this.lastFrame = 0;
    this.liveConfig = null;
    this.configStatus = 'loading';

    this.buildDOM();
    this.loadConfig();
    this.selectScenario(0);
  }

  Simulator.prototype.effectiveConfig = function () {
    return this.liveConfig || {};
  };

  Simulator.prototype.scenario = function () {
    return this.scenarios[this.scenarioIndex];
  };

  Simulator.prototype.duration = function () {
    var sc = this.scenario();
    if (!sc) return 30;
    var maxT = 0;
    sc.timeline.forEach(function (ev) { if (ev.t > maxT) maxT = ev.t; });
    return Math.max(maxT + 3, 15);
  };

  Simulator.prototype.loadConfig = function () {
    var self = this;
    var started = Date.now();
    var timer = setTimeout(function () {
      self.configStatus = 'default';
      self.updateConfigBadge();
    }, CONFIG_TIMEOUT_MS);

    fetch(SIM_API + '/api/rt/config')
      .then(function (r) { return r.json(); })
      .then(function (d) {
        clearTimeout(timer);
        var map = {};
        (d.config || []).forEach(function (row) {
          var v = parseFloat(row.value);
          if (!isNaN(v)) map[row.key] = v;
        });
        self.liveConfig = map;
        self.configStatus = (Date.now() - started < CONFIG_TIMEOUT_MS) ? 'live' : 'default';
        self.updateConfigBadge();
      })
      .catch(function () {
        clearTimeout(timer);
        self.configStatus = 'default';
        self.updateConfigBadge();
      });
  };

  Simulator.prototype.updateConfigBadge = function () {
    var badge = this.container.querySelector('.gs-config-badge');
    if (!badge) return;
    if (this.configStatus === 'live') {
      badge.textContent = 'Live rules';
      badge.className = 'gs-config-badge gs-config-live';
    } else if (this.configStatus === 'default') {
      badge.textContent = 'Default rules';
      badge.className = 'gs-config-badge gs-config-default';
    } else {
      badge.textContent = 'Loading rules…';
      badge.className = 'gs-config-badge gs-config-loading';
    }
  };

  // ──────────────────────────────────────────────────────────────
  // DOM BUILD
  // ──────────────────────────────────────────────────────────────
  Simulator.prototype.buildDOM = function () {
    var self = this;
    var container = this.container;

    container.innerHTML = '';
    var root = el('div', { class: 'gs-root gs-mode-' + this.config.mode });
    root.style.setProperty('--gs-brand', this.config.brandColor);

    // Header
    var header = el('div', { class: 'gs-header' }, [
      el('div', { class: 'gs-title', text: this.config.brand }),
      el('div', { class: 'gs-config-badge gs-config-loading', text: 'Loading rules…' })
    ]);
    root.appendChild(header);

    // Scenario tabs
    var tabs = el('div', { class: 'gs-tabs' });
    this.scenarios.forEach(function (sc, i) {
      var t = el('button', {
        class: 'gs-tab' + (i === 0 ? ' gs-tab-active' : ''),
        type: 'button',
        'data-idx': String(i),
        text: sc.title,
        onclick: function () { self.selectScenario(i); }
      });
      tabs.appendChild(t);
    });
    root.appendChild(tabs);

    // Phase rail
    var rail = el('div', { class: 'gs-rail' }, [
      el('div', { class: 'gs-rail-node', 'data-phase': 'propose' }, ['Propose']),
      el('div', { class: 'gs-rail-line', 'data-line': 'propose-vote' }),
      el('div', { class: 'gs-rail-node', 'data-phase': 'discuss' }, ['Discuss']),
      el('div', { class: 'gs-rail-line', 'data-line': 'discuss-vote' }),
      el('div', { class: 'gs-rail-node', 'data-phase': 'vote' }, ['Vote']),
      el('div', { class: 'gs-rail-line', 'data-line': 'vote-execute' }),
      el('div', { class: 'gs-rail-node', 'data-phase': 'execute' }, ['Execute'])
    ]);
    root.appendChild(rail);

    // Chamber (SVG dots)
    var chamber = el('div', { class: 'gs-chamber' });
    chamber.innerHTML = '<svg viewBox="0 0 400 400" xmlns="http://www.w3.org/2000/svg"><text x="200" y="24" text-anchor="middle" class="gs-chamber-label">ELIGIBLE POOL</text><g class="gs-dots"></g><text x="200" y="386" text-anchor="middle" class="gs-chamber-count">—</text></svg>';
    root.appendChild(chamber);

    // Tally bar
    var tally = el('div', { class: 'gs-tally-wrap' });
    tally.innerHTML = [
      '<div class="gs-tally-bar">',
      '  <div class="gs-tally-fill gs-tally-yes" style="width:0%"></div>',
      '  <div class="gs-tally-fill gs-tally-no" style="width:0%"></div>',
      '  <div class="gs-tally-fill gs-tally-abstain" style="width:0%"></div>',
      '  <div class="gs-marker gs-marker-quorum" title="Quorum"><span>Q</span></div>',
      '  <div class="gs-marker gs-marker-pass" title="Pass"><span>P</span></div>',
      '  <div class="gs-marker gs-marker-block" title="Block"><span>B</span></div>',
      '</div>',
      '<div class="gs-tally-legend">',
      '  <span class="gs-leg gs-leg-yes">✓ <b class="gs-num-yes">0</b> Yes</span>',
      '  <span class="gs-leg gs-leg-no">✗ <b class="gs-num-no">0</b> No</span>',
      '  <span class="gs-leg gs-leg-abstain">◯ <b class="gs-num-abstain">0</b> Abstain</span>',
      '  <span class="gs-leg gs-leg-meta">—</span>',
      '</div>'
    ].join('');
    root.appendChild(tally);

    // BLOCK WINS banner (hidden by default)
    var blockBanner = el('div', { class: 'gs-block-banner' }, ['BLOCK WINS']);
    blockBanner.style.display = 'none';
    root.appendChild(blockBanner);

    // Rule inspector
    var inspector = el('div', { class: 'gs-inspector' }, [
      el('div', { class: 'gs-inspector-label', text: 'Rule Inspector' }),
      el('div', { class: 'gs-inspector-text', text: '—' })
    ]);
    root.appendChild(inspector);

    // Execute panel (per-kind)
    var executePanel = el('div', { class: 'gs-execute-panel', 'data-panel': 'execute' });
    executePanel.style.display = 'none';
    root.appendChild(executePanel);

    // Audit chain ticker (full mode: always visible; compact: collapsible)
    var tickerWrapper;
    if (this.config.mode === 'compact') {
      tickerWrapper = el('details', { class: 'gs-ticker-details' });
      var summary = el('summary', { class: 'gs-ticker-summary', text: 'Show audit chain' });
      tickerWrapper.appendChild(summary);
    } else {
      tickerWrapper = el('div');
    }
    var ticker = el('div', { class: 'gs-ticker' }, [
      el('div', { class: 'gs-ticker-head' }, [
        el('div', { class: 'gs-ticker-label', text: 'Audit Chain' }),
        el('button', { class: 'gs-verify-btn', type: 'button', onclick: function () { self.verifyChain(); }, text: 'Verify' })
      ]),
      el('div', { class: 'gs-ticker-chain', 'data-role': 'chain' }, [
        el('div', { class: 'gs-ticker-empty', text: 'Loading chain…' })
      ])
    ]);
    tickerWrapper.appendChild(ticker);
    root.appendChild(tickerWrapper);

    // Controls
    var controls = el('div', { class: 'gs-controls' }, [
      el('button', { class: 'gs-btn gs-btn-primary', type: 'button', onclick: function () { self.toggle(); }, 'data-role': 'play', text: '▶ Play' }),
      el('button', { class: 'gs-btn', type: 'button', onclick: function () { self.step(); }, text: 'Step →' }),
      el('button', { class: 'gs-btn', type: 'button', onclick: function () { self.reset(); }, text: '↻ Reset' })
    ]);
    root.appendChild(controls);

    container.appendChild(root);
  };

  // ──────────────────────────────────────────────────────────────
  // STATE MACHINE — deterministic, recompute from t=0
  // ──────────────────────────────────────────────────────────────
  Simulator.prototype.computeAt = function (t) {
    var sc = this.scenario();
    var rules = R();
    var cfg = this.effectiveConfig();

    var state = {
      phase: 'propose',
      yes: 0, no: 0, abstain: 0,
      comments: [],
      voteStarts: null, voteEnds: null,
      objectionAt: null, objectionUntil: null,
      closedAt: null,
      outcome: null,
      execution: null,
      reconsidering: false,
      reversed: false
    };

    for (var i = 0; i < sc.timeline.length; i++) {
      var ev = sc.timeline[i];
      if (ev.t > t) break;

      switch (ev.type) {
        case 'propose':
          state.phase = 'discuss';
          break;
        case 'comment':
          state.comments.push(ev);
          break;
        case 'open_vote':
          state.phase = 'vote';
          state.voteStarts = ev.t;
          state.voteEnds = ev.t + rules.computeVotePeriodDays(sc.kind) * 86400;
          break;
        case 'vote_batch':
          state.yes += ev.yes || 0;
          state.no += ev.no || 0;
          state.abstain += ev.abstain || 0;
          break;
        case 'objection':
          state.objectionAt = ev.t;
          state.objectionUntil = ev.pause_until_t;
          if (state.voteEnds) state.voteEnds += rules.BENCH_PAUSE_SECONDS;
          break;
        case 'resume_vote':
          state.objectionAt = null;
          state.objectionUntil = null;
          break;
        case 'close_vote':
          state.outcome = rules.computeOutcome({
            kind: sc.kind,
            tallies: { yes: state.yes, no: state.no, abstain: state.abstain },
            eligible: sc.eligible,
            config: cfg
          });
          state.phase = 'execute';
          state.closedAt = ev.t;
          break;
        case 'apply':
          state.execution = { type: 'applied', note: ev.note };
          break;
        case 'awaiting_merge':
          state.execution = { type: 'awaiting_merge', pr_url: ev.pr_url, note: ev.note };
          break;
        case 'merge':
          state.execution = { type: 'merged', commit_sha: ev.commit_sha, note: ev.note };
          break;
        case 'reconsider_sign':
          state.reconsidering = true;
          break;
        case 'reconsider_open':
          state.yes = 0; state.no = 0; state.abstain = 0;
          state.phase = 'vote';
          state.outcome = null;
          state.execution = null;
          state.closedAt = null;
          break;
        case 'reversed':
          state.reversed = true;
          break;
      }
    }
    return state;
  };

  // ──────────────────────────────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────────────────────────────
  Simulator.prototype.render = function () {
    var state = this.computeAt(this.currentT);
    var sc = this.scenario();
    this.renderRail(state);
    this.renderChamber(state, sc);
    this.renderTally(state, sc);
    this.renderInspector(state);
    this.renderExecute(state, sc);
    this.renderTicker(state, sc);
    this.renderPlayBtn();
  };

  Simulator.prototype.renderRail = function (state) {
    var rail = this.container.querySelector('.gs-rail');
    if (!rail) return;
    var activePhase = state.phase;
    // Map phase names to rail node data-phase
    var phaseMap = { propose: 'propose', discuss: 'discuss', vote: 'vote', execute: 'execute' };
    rail.querySelectorAll('.gs-rail-node').forEach(function (n) {
      var p = n.getAttribute('data-phase');
      n.classList.toggle('gs-node-active', p === phaseMap[activePhase]);
      n.classList.toggle('gs-node-done', ['propose', 'discuss', 'vote'].indexOf(activePhase) > ['propose', 'discuss', 'vote'].indexOf(p));
    });
  };

  Simulator.prototype.renderChamber = function (state, sc) {
    var g = this.container.querySelector('.gs-dots');
    if (!g) return;
    var countEl = this.container.querySelector('.gs-chamber-count');
    var eligible = sc.eligible || 100;
    var dotLimit = this.config.mode === 'compact' ? Math.min(50, eligible) : Math.min(100, eligible);
    var totalVotes = state.yes + state.no + state.abstain;
    var yesDots = Math.round((state.yes / eligible) * dotLimit);
    var noDots = Math.round((state.no / eligible) * dotLimit);
    var abstainDots = Math.round((state.abstain / eligible) * dotLimit);
    var votedDots = yesDots + noDots + abstainDots;

    // Circle layout
    var cx = 200, cy = 200, radius = 140;
    var svgNS = 'http://www.w3.org/2000/svg';
    g.innerHTML = '';

    for (var i = 0; i < dotLimit; i++) {
      var angle = (i / dotLimit) * Math.PI * 2 - Math.PI / 2;
      var x = cx + Math.cos(angle) * radius;
      var y = cy + Math.sin(angle) * radius;
      var cls = 'gs-dot gs-dot-dim';
      if (i < yesDots) cls = 'gs-dot gs-dot-yes';
      else if (i < yesDots + noDots) cls = 'gs-dot gs-dot-no';
      else if (i < votedDots) cls = 'gs-dot gs-dot-abstain';
      var circle = document.createElementNS(svgNS, 'circle');
      circle.setAttribute('cx', x.toFixed(1));
      circle.setAttribute('cy', y.toFixed(1));
      circle.setAttribute('r', '6');
      circle.setAttribute('class', cls);
      g.appendChild(circle);
    }

    if (countEl) {
      countEl.textContent = totalVotes + ' / ' + eligible + ' voted';
    }
  };

  Simulator.prototype.renderTally = function (state, sc) {
    var rules = R();
    var cfg = this.effectiveConfig();
    var eligible = sc.eligible || 100;
    var total = state.yes + state.no + state.abstain;

    var yesEl = this.container.querySelector('.gs-tally-yes');
    var noEl = this.container.querySelector('.gs-tally-no');
    var abstainEl = this.container.querySelector('.gs-tally-abstain');
    if (yesEl) yesEl.style.width = pct(state.yes, total) + '%';
    if (noEl) noEl.style.width = pct(state.no, total) + '%';
    if (abstainEl) abstainEl.style.width = pct(state.abstain, total) + '%';

    var q = rules.computeQuorum(eligible, cfg);
    var threshold = rules.thresholdFor(sc.kind, cfg);
    var block = (cfg && cfg.block_pct) || 0.25;

    var qMarker = this.container.querySelector('.gs-marker-quorum');
    var pMarker = this.container.querySelector('.gs-marker-pass');
    var bMarker = this.container.querySelector('.gs-marker-block');
    if (qMarker) qMarker.style.left = Math.min(100, (q / eligible) * 100) + '%';
    if (pMarker) pMarker.style.left = (threshold * 100) + '%';
    if (bMarker) bMarker.style.left = (block * 100) + '%';

    this.container.querySelector('.gs-num-yes').textContent = state.yes;
    this.container.querySelector('.gs-num-no').textContent = state.no;
    this.container.querySelector('.gs-num-abstain').textContent = state.abstain;

    var metaEl = this.container.querySelector('.gs-leg-meta');
    if (metaEl) {
      var totalVotes = state.yes + state.no + state.abstain;
      var quorumMet = totalVotes >= q;
      var statusIcon = quorumMet ? '✓' : '·';
      metaEl.textContent = statusIcon + ' ' + totalVotes + ' votes · ' + q + ' for quorum ('
                        + Math.round(((cfg && cfg.quorum_pct) || 0.20) * 100) + '%)'
                        + ' · pass ' + Math.round(threshold * 100) + '%'
                        + ' · block ' + Math.round(block * 100) + '%';
    }

    // BLOCK WINS banner
    var banner = this.container.querySelector('.gs-block-banner');
    var blocked = state.outcome && state.outcome.blocked;
    if (banner) {
      if (blocked) {
        banner.style.display = 'block';
        if (!this.reduceMotion) {
          banner.classList.remove('gs-banner-slam');
          void banner.offsetWidth;
          banner.classList.add('gs-banner-slam');
        }
        yesEl && yesEl.parentElement.classList.add('gs-tally-flash');
      } else {
        banner.style.display = 'none';
        yesEl && yesEl.parentElement.classList.remove('gs-tally-flash');
      }
    }
  };

  Simulator.prototype.renderInspector = function (state) {
    var textEl = this.container.querySelector('.gs-inspector-text');
    if (!textEl) return;
    if (state.outcome) {
      textEl.textContent = state.outcome.reason;
    } else if (state.phase === 'propose') {
      textEl.textContent = 'Proposal submitted. Comment period begins.';
    } else if (state.phase === 'discuss') {
      textEl.textContent = 'Comment period ongoing — ' + state.comments.length + ' comment' + (state.comments.length === 1 ? '' : 's') + ' so far.';
    } else if (state.phase === 'vote') {
      textEl.textContent = 'Vote open. ' + (state.yes + state.no + state.abstain) + ' votes cast.';
    } else {
      textEl.textContent = '—';
    }
  };

  Simulator.prototype.renderPlayBtn = function () {
    var btn = this.container.querySelector('[data-role="play"]');
    if (btn) btn.textContent = this.isPlaying ? '❚❚ Pause' : '▶ Play';
  };

  // ──────────────────────────────────────────────────────────────
  // PLAYBACK
  // ──────────────────────────────────────────────────────────────
  Simulator.prototype.tick = function (now) {
    if (!this.isPlaying) return;
    var dt = now - this.lastFrame;
    this.lastFrame = now;
    this.currentT += (dt / 1000) * this.speed;
    if (this.currentT >= this.duration()) {
      this.currentT = this.duration();
      this.isPlaying = false;
    }
    this.render();
    if (this.isPlaying) {
      var self = this;
      this.raf = requestAnimationFrame(function (n) { self.tick(n); });
    }
  };

  Simulator.prototype.play = function () {
    if (this.isPlaying) return;
    if (this.currentT >= this.duration()) this.currentT = 0;
    this.isPlaying = true;
    this.lastFrame = performance.now();
    var self = this;
    this.raf = requestAnimationFrame(function (n) { self.tick(n); });
    this.renderPlayBtn();
  };

  Simulator.prototype.pause = function () {
    this.isPlaying = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.renderPlayBtn();
  };

  Simulator.prototype.toggle = function () {
    if (this.isPlaying) this.pause(); else this.play();
  };

  Simulator.prototype.step = function () {
    this.pause();
    var sc = this.scenario();
    var nextT = Infinity;
    for (var i = 0; i < sc.timeline.length; i++) {
      if (sc.timeline[i].t > this.currentT) { nextT = sc.timeline[i].t; break; }
    }
    this.currentT = Math.min(nextT === Infinity ? this.duration() : nextT, this.duration());
    this.render();
  };

  Simulator.prototype.reset = function () {
    this.pause();
    this.currentT = 0;
    this.render();
  };

  Simulator.prototype.selectScenario = function (idx) {
    var self = this;
    this.scenarioIndex = idx;
    this.currentT = 0;
    this.tamperedAt = -1;
    this.chain = null;
    this.container.querySelectorAll('.gs-tab').forEach(function (t, i) {
      t.classList.toggle('gs-tab-active', i === idx);
    });
    this.buildChain().then(function (chain) {
      self.chain = chain;
      self.render();
      if (self.config.autoplay && !self.reduceMotion) self.play();
    }).catch(function () {
      self.chain = [];
      self.render();
    });
  };

  Simulator.prototype.destroy = function () {
    this.pause();
    this.container.innerHTML = '';
  };



  // ──────────────────────────────────────────────────────────────
  // AUDIT CHAIN — precompute hashes for current scenario
  // ──────────────────────────────────────────────────────────────
  Simulator.prototype.buildChain = async function () {
    var sc = this.scenario();
    var rules = R();
    var chain = [];
    var prev = 'GENESIS';
    var AUDITED = ['propose', 'comment', 'vote_batch', 'objection', 'resume_vote',
                   'close_vote', 'apply', 'awaiting_merge', 'merge',
                   'reconsider_sign', 'reconsider_open', 'reversed'];
    for (var i = 0; i < sc.timeline.length; i++) {
      var ev = sc.timeline[i];
      if (AUDITED.indexOf(ev.type) === -1) continue;
      var payloadObj = {};
      for (var k in ev) if (k !== 't') payloadObj[k] = ev[k];
      var payload = JSON.stringify(payloadObj);
      var hash = await rules.sha256Hex(prev + '|' + ev.type + '|' + payload);
      chain.push({ eventIndex: i, type: ev.type, t: ev.t, payload: payload, prev: prev, hash: hash });
      prev = hash;
    }
    return chain;
  };

  Simulator.prototype.renderTicker = function (state, sc) {
    var chainEl = this.container.querySelector('[data-role="chain"]');
    if (!chainEl) return;
    if (!this.chain) {
      chainEl.innerHTML = '<div class="gs-ticker-empty">Loading chain…</div>';
      return;
    }
    if (!this.chain.length) {
      chainEl.innerHTML = '<div class="gs-ticker-empty">No events yet.</div>';
      return;
    }

    var now = this.currentT;
    var tampered = this.tamperedAt;
    var html = '';
    for (var i = 0; i < this.chain.length; i++) {
      var entry = this.chain[i];
      if (entry.t > now) break;
      var cls = 'gs-ticker-block';
      if (tampered >= 0 && i === tampered) cls += ' gs-tampered';
      else if (tampered >= 0 && i > tampered) cls += ' gs-broken';
      var payloadPreview = entry.payload.length > 40
        ? entry.payload.slice(0, 37) + '…'
        : entry.payload;
      html += '<div class="' + cls + '" data-idx="' + i + '">'
            +   '<div class="gs-block-head">'
            +     '<span class="gs-block-type">' + esc(entry.type) + '</span>'
            +     '<button class="gs-tamper-btn" type="button" data-tamper="' + i + '" title="Simulate tampering">⚡</button>'
            +   '</div>'
            +   '<div class="gs-block-hash" title="' + esc(entry.hash) + '">' + esc(entry.hash.slice(0, 10)) + '…</div>'
            +   '<div class="gs-block-prev">← ' + esc(entry.prev.slice(0, 8)) + '…</div>'
            +   '<div class="gs-block-payload">' + esc(payloadPreview) + '</div>'
            + '</div>';
    }

    chainEl.innerHTML = html || '<div class="gs-ticker-empty">No events yet.</div>';

    var self = this;
    chainEl.querySelectorAll('[data-tamper]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        var idx = parseInt(btn.getAttribute('data-tamper'), 10);
        if (self.tamperedAt === idx) self.tamperedAt = -1;
        else self.tamperedAt = idx;
        self.render();
      });
    });
  };

  Simulator.prototype.verifyChain = function () {
    var chainEl = this.container.querySelector('[data-role="chain"]');
    if (!chainEl || !this.chain) return;
    if (this.tamperedAt >= 0) {
      chainEl.classList.add('gs-verify-fail');
      chainEl.classList.remove('gs-verify-ok');
      var alert = document.createElement('div');
      alert.className = 'gs-verify-alert';
      alert.textContent = 'intact: false — broken at block #' + (this.tamperedAt + 1);
      chainEl.insertBefore(alert, chainEl.firstChild);
      setTimeout(function () { if (alert.parentNode) alert.parentNode.removeChild(alert); }, 3000);
    } else {
      chainEl.classList.add('gs-verify-ok');
      chainEl.classList.remove('gs-verify-fail');
      var alertOk = document.createElement('div');
      alertOk.className = 'gs-verify-alert gs-verify-alert-ok';
      alertOk.textContent = 'intact: true — ' + this.chain.length + ' blocks verified';
      chainEl.insertBefore(alertOk, chainEl.firstChild);
      setTimeout(function () { if (alertOk.parentNode) alertOk.parentNode.removeChild(alertOk); }, 3000);
    }
  };

  // ──────────────────────────────────────────────────────────────
  // EXECUTE PANEL — per-kind visuals
  // ──────────────────────────────────────────────────────────────
  Simulator.prototype.renderExecute = function (state, sc) {
    var panel = this.container.querySelector('[data-panel="execute"]');
    if (!panel) return;
    if (!state.outcome) {
      panel.style.display = 'none';
      return;
    }
    if (state.reversed) {
      panel.style.display = 'block';
      panel.innerHTML = '<div class="gs-exec gs-exec-reversed">'
                      + '<div class="gs-exec-icon">↺</div>'
                      + '<div class="gs-exec-body">'
                      + '<div class="gs-exec-title">Resolution reversed</div>'
                      + '<div class="gs-exec-desc">NO crossed the 25% block threshold on reconsider. The original decision is marked reversed.</div>'
                      + '</div></div>';
      return;
    }
    if (!state.outcome.passed) {
      panel.style.display = 'none';
      return;
    }
    panel.style.display = 'block';

    var html = '';
    var cfg = this.effectiveConfig();
    var delay = R().computeApplyDelaySeconds(sc.kind);

    if (sc.kind === 'config') {
      html = '<div class="gs-exec gs-exec-config">'
           + '<div class="gs-exec-icon gs-exec-icon-pulse">⚙️</div>'
           + '<div class="gs-exec-body">'
           + '<div class="gs-exec-title">Config applied</div>'
           + '<div class="gs-exec-desc">' + esc((state.execution && state.execution.note) || 'Setting changes applied immediately.') + '</div>'
           + '<div class="gs-exec-toggle"><span class="gs-toggle-track"><span class="gs-toggle-knob"></span></span> <span class="gs-toggle-label">Enforced</span></div>'
           + '</div></div>';
    } else if (sc.kind === 'meta') {
      html = '<div class="gs-exec gs-exec-meta">'
           + '<div class="gs-exec-icon">⏳</div>'
           + '<div class="gs-exec-body">'
           + '<div class="gs-exec-title">Meta rule — 72h apply delay</div>'
           + '<div class="gs-exec-desc">' + esc((state.execution && state.execution.note) || 'Rule change takes effect after 72 hours.') + '</div>'
           + '<div class="gs-exec-countdown"><span class="gs-countdown-big">72:00:00</span> <span class="gs-countdown-lbl">reconsider window open</span></div>'
           + '</div></div>';
    } else if (sc.kind === 'code') {
      var merged = state.execution && state.execution.type === 'merged';
      html = '<div class="gs-exec gs-exec-code">'
           + '<div class="gs-exec-icon">🔀</div>'
           + '<div class="gs-exec-body">'
           + '<div class="gs-exec-title">Code proposal</div>'
           + '<div class="gs-exec-desc">' + esc((state.execution && state.execution.note) || 'Awaiting linked PR and human merge.') + '</div>'
           + '<div class="gs-pr-card">'
           + '<div class="gs-pr-url">' + esc((state.execution && state.execution.pr_url) || 'PR not linked yet') + '</div>'
           + (merged
               ? '<div class="gs-pr-status gs-pr-merged">✓ Merged — SHA ' + esc((state.execution && state.execution.commit_sha) || '') + '</div>'
               : '<div class="gs-pr-status gs-pr-waiting">⏳ Awaiting maintainer review — nothing auto-merges</div>')
           + '</div>'
           + '</div></div>';
    } else {
      html = '<div class="gs-exec gs-exec-advisory">'
           + '<div class="gs-exec-icon">📢</div>'
           + '<div class="gs-exec-body">'
           + '<div class="gs-exec-title">Recorded as community signal</div>'
           + '<div class="gs-exec-desc">Advisory proposals do not apply any automatic change. The tally is a public record of community intent.</div>'
           + '</div></div>';
    }
    panel.innerHTML = html;
  };

  // ──────────────────────────────────────────────────────────────
  // PUBLIC API
  // ──────────────────────────────────────────────────────────────
  global.GovernanceSimulator = {
    init: function (container, config) {
      if (!container) return null;
      return new Simulator(container, config);
    }
  };
})(typeof globalThis !== 'undefined' ? globalThis : window);
