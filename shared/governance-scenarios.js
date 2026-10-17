// Governance Simulator — 5 demo scenarios
// Each teaches one distinct mechanic. Add/remove/edit freely.
// No dependencies. Works on any site.

window.GOVERNANCE_SIM_SCENARIOS = [
  {
    id: 'config-pass',
    title: 'Enable read-aloud mode by default',
    kind: 'config',
    category: 'feature',
    author: 'u42',
    createdAt: '3 days ago',
    body: 'Turn on read-aloud by default for all new sessions. Users can opt out in settings. Improves accessibility, especially for commuters and users with screen fatigue.',
    eligible: 28,
    quorumPct: 0.20,
    thresholdPct: 0.66,
    blockPct: 0.25,
    discussion: [
      { author: 'u17', body: 'Strong accessibility win. Ship it.' },
      { author: 'u9', body: 'Could we make it opt-in instead to be safer?' },
      { author: 'u42', body: 'Opt-in means most users never enable it. The proposal includes an opt-out toggle, so nobody is stuck.' }
    ],
    votes: { yes: 16, no: 3, abstain: 2 },
    outcome: 'passed',
    outcomeReason: 'Quorum met (21/28) · Yes 76% · No 14% — passes above the 66% threshold.',
    execution: { type: 'config', description: 'read_aloud_default = true (applied immediately)' }
  },
  {
    id: 'meta-blocked',
    title: 'Lower the pass threshold to 60%',
    kind: 'meta',
    category: 'meta',
    author: 'u8',
    createdAt: '5 days ago',
    body: 'Change the default pass threshold from 66% to 60%. Would apply to all future proposals except meta (which keeps 75%).',
    eligible: 28,
    quorumPct: 0.20,
    thresholdPct: 0.75,
    blockPct: 0.25,
    discussion: [
      { author: 'u31', body: 'Makes it easier to pass proposals — but is that a good thing?' },
      { author: 'u12', body: 'Too easy to lower the bar when the current bar is protecting us.' }
    ],
    votes: { yes: 17, no: 8, abstain: 1 },
    outcome: 'blocked',
    outcomeReason: 'Yes 68% clears the ordinary 66% bar — but 32% NO exceeds the 25% block threshold. Block wins.',
    execution: null
  },
  {
    id: 'code-pr',
    title: 'Add WebAuthn passkey login',
    kind: 'code',
    category: 'security',
    author: 'u22',
    createdAt: '2 days ago',
    body: 'Add passkey as a second login option alongside email/password. Uses the browser\'s native WebAuthn API. PR #142 implements the full flow.',
    eligible: 28,
    quorumPct: 0.20,
    thresholdPct: 0.66,
    blockPct: 0.25,
    discussion: [
      { author: 'u14', body: 'Big security upgrade. PR looks clean.' },
      { author: 'u6', body: 'Is there a fallback for older browsers? Yes — the PR keeps password login available.' }
    ],
    votes: { yes: 15, no: 4, abstain: 1 },
    outcome: 'passed',
    outcomeReason: 'Quorum met · Yes 75% · No 20% — passes. Code execution requires a linked PR.',
    execution: { type: 'code', description: 'PR #142 merged — SHA recorded in audit chain' }
  },
  {
    id: 'advisory-pass',
    title: 'Prioritize mobile performance in Q4',
    kind: 'advisory',
    category: 'policy',
    author: 'u35',
    createdAt: '1 day ago',
    body: 'Community signal: focus the next quarter\'s development on mobile Core Web Vitals improvements. Non-binding — but tells maintainers what users care about.',
    eligible: 28,
    quorumPct: 0.20,
    thresholdPct: 0.66,
    blockPct: 0.25,
    discussion: [
      { author: 'u3', body: 'Mobile LCP is my biggest pain point. Yes.' },
      { author: 'u19', body: 'Agree — but leave room for feature work too.' }
    ],
    votes: { yes: 12, no: 5, abstain: 3 },
    outcome: 'passed',
    outcomeReason: 'Quorum met · Yes 60% of votes cast · Advisory proposals signal direction; no automatic change.',
    execution: { type: 'advisory', description: 'Recorded as community signal — no automatic change' }
  },
  {
    id: 'rejected',
    title: 'Require karma minimum to post proposals',
    kind: 'config',
    category: 'policy',
    author: 'u29',
    createdAt: '4 days ago',
    body: 'Require 100+ karma before an entity can create a proposal. Intended to prevent spam; opponents argue it makes the system gatekept.',
    eligible: 28,
    quorumPct: 0.20,
    thresholdPct: 0.66,
    blockPct: 0.25,
    discussion: [
      { author: 'u4', body: 'Gatekeeping by karma contradicts the equal-authority principle.' },
      { author: 'u29', body: 'Some friction protects quality.' },
      { author: 'u11', body: 'The eligibility rule already requires 7 days + activity. That is enough.' }
    ],
    votes: { yes: 8, no: 12, abstain: 4 },
    outcome: 'rejected',
    outcomeReason: 'Quorum met but only 33% YES — well below 66% threshold. Rejected.',
    execution: null
  }
];
