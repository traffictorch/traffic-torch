// Governance Simulator — vanilla JS, zero dependencies
// Usage:
//   <div id="sim"></div>
//   <script>GovernanceSimulator.init(document.getElementById('sim'), { brand: 'My DAO' });</script>

(function () {
  'use strict';

  var PHASES = ['proposing', 'discussing', 'voting', 'deciding', 'executing', 'done'];
  var DURATIONS = { proposing: 3000, discussing: 6000, voting: 8000, deciding: 5000, executing: 5000, done: 3000 };

  var DEFAULTS = {
    brand: 'Governance Simulator',
    brandColor: '#ff8a3d',
    scenarios: window.GOVERNANCE_SIM_SCENARIOS || [],
    defaultScenario: 'config-pass',
    autoplay: true,
    compact: false
  };

  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  function pct(n, total) { return total ? Math.round(n / total * 100) : 0; }

  function Simulator(el, config) {
    this.el = el;
    this.config = Object.assign({}, DEFAULTS, config || {});
    if (!this.config.scenarios.length) {
      el.innerHTML = '<div class="gs-root"><div class="gs-stage" style="padding:2rem;text-align:center;color:#999">No scenarios loaded. Include governance-scenarios.js first.</div></div>';
      return;
    }
    this.scenarios = this.config.scenarios;
    this.scenarioIndex = Math.max(0, this.scenarios.findIndex(function (s) { return s.id === this.config.defaultScenario; }.bind(this)));
    this.scenario = this.scenarios[this.scenarioIndex];
    this.phase = 'proposing';
    this.phaseProgress = 0;
    this.visibleComments = 0;
    this.visibleVotes = { yes: 0, no: 0, abstain: 0 };
    this.playing = false;
    this.raf = null;
    this.startTime = 0;
    this.pausedAt = 0;
    this.buildUI();
    this.loadScenario(this.scenario.id, { autostart: this.config.autoplay });
  }

  Simulator.prototype.buildUI = function () {
    var compact = !!this.config.compact;
    var rootCls = 'gs-root' + (compact ? ' gs-compact' : '');
    var headerHtml = '<div class="gs-header">' +
      '<div class="gs-title">' + esc(this.config.brand) + '</div>' +
      (compact ? '' : '<div class="gs-subtitle">A 30-second walkthrough — no account, no vote, no commitment</div>') +
      '</div>';
    var tabsHtml = compact ? '' : '<div class="gs-tabs" id="gs-tabs"></div>';
    var controlsHtml = compact
      ? '<div class="gs-compact-footer">' +
          '<button class="gs-btn gs-btn-compact" id="gs-play" type="button">⏸ Pause</button>' +
          '<a class="gs-see-full" href="/simulator/">See all 5 scenarios →</a>' +
        '</div>'
      : '<div class="gs-controls">' +
          '<button class="gs-btn gs-btn-primary" id="gs-play" type="button">▶ Play</button>' +
          '<button class="gs-btn" id="gs-step" type="button">Step →</button>' +
          '<button class="gs-btn" id="gs-reset" type="button">↻ Reset</button>' +
          '<div class="gs-phase-label" id="gs-phase-label"></div>' +
        '</div>';
    this.el.innerHTML =
      '<div class="' + rootCls + '" style="--gs-brand:' + esc(this.config.brandColor) + '">' +
        headerHtml +
        tabsHtml +
        '<div class="gs-stage" id="gs-stage"></div>' +
        '<div class="gs-progress"><div class="gs-progress-bar" id="gs-progress-bar"></div></div>' +
        controlsHtml +
        '<div class="gs-footer" id="gs-footer"></div>' +
      '</div>';
    this.renderTabs();
    this.bind();
  };

  Simulator.prototype.renderTabs = function () {
    if (this.config.compact) return;
    var tabs = this.el.querySelector('#gs-tabs');
    if (!tabs) return;
    var self = this;
    tabs.innerHTML = this.scenarios.map(function (s, i) {
      var label = s.title.length > 42 ? s.title.substring(0, 42) + '…' : s.title;
      return '<button class="gs-tab' + (i === self.scenarioIndex ? ' gs-tab-active' : '') + '" data-index="' + i + '" type="button" title="' + esc(s.title) + '">' + esc(label) + '</button>';
    }).join('');
    Array.prototype.forEach.call(tabs.querySelectorAll('.gs-tab'), function (btn) {
      btn.addEventListener('click', function () {
        self.loadScenario(self.scenarios[parseInt(btn.dataset.index, 10)].id, { autostart: false });
      });
    });
  };

  Simulator.prototype.bind = function () {
    var self = this;
    var play = this.el.querySelector('#gs-play');
    if (play) play.addEventListener('click', function () { self.toggle(); });
    var step = this.el.querySelector('#gs-step');
    if (step) step.addEventListener('click', function () { self.step(); });
    var reset = this.el.querySelector('#gs-reset');
    if (reset) reset.addEventListener('click', function () { self.reset(); });

    // Compact mode: only autoplay when in viewport
    if (this.config.compact && 'IntersectionObserver' in window) {
      var observer = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            if (!self.playing) self.play();
          } else {
            if (self.playing) self.pause();
          }
        });
      }, { threshold: 0.25 });
      observer.observe(this.el);
      this._observer = observer;
    }
  };

  Simulator.prototype.loadScenario = function (id, opts) {
    this.stop();
    this.scenarioIndex = Math.max(0, this.scenarios.findIndex(function (s) { return s.id === id; }));
    this.scenario = this.scenarios[this.scenarioIndex];
    this.phase = 'proposing';
    this.phaseProgress = 0;
    this.visibleComments = 0;
    this.visibleVotes = { yes: 0, no: 0, abstain: 0 };
    this.pausedAt = 0;
    this.renderTabs();
    this.render();
    if (opts && opts.autostart) this.play();
  };

  Simulator.prototype.play = function () {
    if (this.playing) return;
    this.playing = true;
    this.updatePlayBtn();
    this.startTime = performance.now() - this.pausedAt;
    var self = this;
    this.raf = requestAnimationFrame(function () { self.tick(); });
  };

  Simulator.prototype.pause = function () {
    if (!this.playing) return;
    this.playing = false;
    this.pausedAt = performance.now() - this.startTime;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.updatePlayBtn();
  };

  Simulator.prototype.toggle = function () { if (this.playing) this.pause(); else this.play(); };

  Simulator.prototype.stop = function () {
    this.playing = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.startTime = 0;
    this.pausedAt = 0;
    this.updatePlayBtn();
  };

  Simulator.prototype.reset = function () { this.loadScenario(this.scenario.id, { autostart: false }); };

  Simulator.prototype.step = function () {
    this.pause();
    var idx = PHASES.indexOf(this.phase);
    if (idx >= PHASES.length - 1) return;
    this.phase = PHASES[idx + 1];
    this.phaseProgress = 0;
    this.syncSubState();
    this.render();
  };

  Simulator.prototype.syncSubState = function () {
    if (this.phase === 'discussing') this.visibleComments = 0;
    else if (this.phase === 'voting') this.visibleVotes = { yes: 0, no: 0, abstain: 0 };
    else {
      this.visibleComments = this.scenario.discussion.length;
      this.visibleVotes = Object.assign({}, this.scenario.votes);
    }
  };

  Simulator.prototype.tick = function () {
    if (!this.playing) return;
    var elapsed = performance.now() - this.startTime;
    var dur = DURATIONS[this.phase];
    this.phaseProgress = Math.min(1, elapsed / dur);

    if (this.phase === 'discussing') {
      var n = Math.min(this.scenario.discussion.length, Math.floor(this.phaseProgress * this.scenario.discussion.length) + 1);
      if (n !== this.visibleComments) { this.visibleComments = n; this.renderStage(); }
    }
    if (this.phase === 'voting') {
      var v = this.scenario.votes;
      var t = this.phaseProgress;
      this.visibleVotes = { yes: Math.floor(v.yes * t), no: Math.floor(v.no * t), abstain: Math.floor(v.abstain * t) };
      this.renderStage();
    }

    var bar = this.el.querySelector('#gs-progress-bar');
    if (bar) bar.style.width = (this.phaseProgress * 100) + '%';

    if (this.phaseProgress >= 1) {
      var idx = PHASES.indexOf(this.phase);
      if (idx >= PHASES.length - 1) { this.playing = false; this.updatePlayBtn(); return; }
      this.phase = PHASES[idx + 1];
      this.phaseProgress = 0;
      this.syncSubState();
      this.startTime = performance.now();
      this.render();
    }

    var self = this;
    this.raf = requestAnimationFrame(function () { self.tick(); });
  };

  Simulator.prototype.render = function () {
    this.renderStage();
    var lbl = this.el.querySelector('#gs-phase-label');
    if (lbl && !this.config.compact) lbl.textContent = 'Phase: ' + this.phase;
    this.updatePlayBtn();
  };

  Simulator.prototype.renderStage = function () {
    var stage = this.el.querySelector('#gs-stage');
    if (!stage) return;
    var html = '';
    if (this.phase === 'proposing') html = this.renderProposing();
    else if (this.phase === 'discussing') html = this.renderDiscussing();
    else if (this.phase === 'voting') html = this.renderVoting();
    else if (this.phase === 'deciding') html = this.renderDeciding();
    else if (this.phase === 'executing') html = this.renderExecuting();
    else html = this.renderDone();
    stage.innerHTML = html;
  };

  Simulator.prototype.renderProposing = function () {
    var s = this.scenario;
    return '<div class="gs-phase gs-phase-proposing">' +
      '<div class="gs-phase-heading">📝 Proposing</div>' +
      '<div class="gs-proposal-card">' +
        '<div class="gs-badges">' +
          '<span class="gs-badge gs-badge-kind">' + esc(s.kind) + '</span>' +
          '<span class="gs-badge gs-badge-cat">' + esc(s.category) + '</span>' +
          '<span class="gs-badge gs-badge-author">by ' + esc(s.author) + '</span>' +
        '</div>' +
        '<h3 class="gs-proposal-title">' + esc(s.title) + '</h3>' +
        '<p class="gs-proposal-body">' + esc(s.body) + '</p>' +
      '</div>' +
    '</div>';
  };

  Simulator.prototype.renderDiscussing = function () {
    var s = this.scenario;
    var shown = s.discussion.slice(0, this.visibleComments);
    return '<div class="gs-phase gs-phase-discussing">' +
      '<div class="gs-phase-heading">💬 Discussing</div>' +
      '<div class="gs-comments">' +
        shown.map(function (c) {
          return '<div class="gs-comment"><span class="gs-comment-author">' + esc(c.author) + '</span><span class="gs-comment-body">' + esc(c.body) + '</span></div>';
        }).join('') +
        (this.visibleComments === 0 ? '<div class="gs-empty">Waiting for comments…</div>' : '') +
      '</div>' +
    '</div>';
  };

  Simulator.prototype.renderVoting = function () {
    var s = this.scenario;
    var v = this.visibleVotes;
    var total = v.yes + v.no + v.abstain;
    return '<div class="gs-phase gs-phase-voting">' +
      '<div class="gs-phase-heading">⚖️ Voting</div>' +
      '<div class="gs-tally-bar">' +
        '<div class="gs-tally-yes" style="width:' + pct(v.yes, total) + '%"></div>' +
        '<div class="gs-tally-no" style="width:' + pct(v.no, total) + '%"></div>' +
        '<div class="gs-tally-abstain" style="width:' + pct(v.abstain, total) + '%"></div>' +
      '</div>' +
      '<div class="gs-tally-legend">' +
        '<span class="gs-tally-yes-t">✓ ' + v.yes + ' Yes</span>' +
        '<span class="gs-tally-no-t">✗ ' + v.no + ' No</span>' +
        '<span class="gs-tally-abstain-t">◯ ' + v.abstain + ' Abstain</span>' +
        '<span class="gs-tally-meta">' + total + ' / ' + s.eligible + ' cast</span>' +
      '</div>' +
      '<div class="gs-tally-rules">Quorum ' + Math.round(s.quorumPct * 100) + '% · Pass ' + Math.round(s.thresholdPct * 100) + '% · Block ' + Math.round(s.blockPct * 100) + '% NO</div>' +
    '</div>';
  };

  Simulator.prototype.renderDeciding = function () {
    var s = this.scenario;
    var cls = 'gs-outcome-' + s.outcome;
    var icons = { passed: '✓', rejected: '✗', blocked: '🛑', no_quorum: '◯' };
    return '<div class="gs-phase gs-phase-deciding">' +
      '<div class="gs-phase-heading">📊 Deciding</div>' +
      '<div class="gs-outcome ' + cls + '">' +
        '<div class="gs-outcome-icon">' + (icons[s.outcome] || '?') + '</div>' +
        '<div class="gs-outcome-label">' + esc(s.outcome) + '</div>' +
        '<div class="gs-outcome-reason">' + esc(s.outcomeReason) + '</div>' +
      '</div>' +
    '</div>';
  };

  Simulator.prototype.renderExecuting = function () {
    var s = this.scenario;
    if (!s.execution) {
      return '<div class="gs-phase gs-phase-executing">' +
        '<div class="gs-phase-heading">⚡ Executing</div>' +
        '<div class="gs-execution gs-execution-none">' +
          '<div class="gs-execution-icon">—</div>' +
          '<div>No execution — the proposal did not pass.</div>' +
        '</div>' +
      '</div>';
    }
    return '<div class="gs-phase gs-phase-executing">' +
      '<div class="gs-phase-heading">⚡ Executing</div>' +
      '<div class="gs-execution">' +
        '<div class="gs-execution-icon">' + (s.execution.type === 'code' ? '🔀' : (s.execution.type === 'config' ? '⚙️' : '📢')) + '</div>' +
        '<div>' +
          '<div class="gs-execution-type">' + esc(s.execution.type) + '</div>' +
          '<div class="gs-execution-desc">' + esc(s.execution.description) + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  };

  Simulator.prototype.renderDone = function () {
    var s = this.scenario;
    var summary = s.outcome === 'passed'
      ? 'This is what a passed ' + s.kind + ' proposal looks like in practice.'
      : 'Every outcome is recorded — rejections and blocks are part of the permanent record.';
    return '<div class="gs-phase gs-phase-done">' +
      '<div class="gs-phase-heading">🏁 Done</div>' +
      '<div class="gs-done">' +
        '<div class="gs-done-icon">🎉</div>' +
        '<div class="gs-done-text">' + esc(summary) + '</div>' +
        '<button class="gs-btn gs-btn-primary" onclick="this.closest(\'.gs-root\').dispatchEvent(new CustomEvent(\'gs-reset\'))" type="button">↻ Play again</button>' +
      '</div>' +
    '</div>';
  };

  Simulator.prototype.updatePlayBtn = function () {
    var btn = this.el.querySelector('#gs-play');
    if (btn) btn.textContent = this.playing ? '⏸ Pause' : '▶ Play';
  };

  Simulator.prototype.destroy = function () { this.stop(); if (this._observer) this._observer.disconnect(); this.el.innerHTML = ''; };

  // Public API
  window.GovernanceSimulator = {
    init: function (el, config) {
      if (!el) return null;
      var inst = new Simulator(el, config);
      // Wire up reset event from "Play again" button
      el.addEventListener('gs-reset', function () { inst.reset(); inst.play(); });
      return inst;
    }
  };
})();
