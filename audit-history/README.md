# Audit Chain Snapshots

Daily external snapshots of the Round Table audit chain head.

Each file `YYYY-MM-DD.json` contains:
- `head_hash` — SHA-256 hash of the last chain entry
- `chain_count` — total entries in the chain
- `last_timestamp` — unix timestamp of last entry
- `verified_intact` — full chain verified on fetch
- `snapshot_at` — when this snapshot was taken

**Why this exists:** the audit chain itself runs on Traffic Torch's server. Publishing the head daily to GitHub creates an external, immutable historical record. If the chain is ever rewritten, the current head won't match historical snapshots committed here.

**How to verify:** run `/api/rt/audit/verify` yourself — it should return `intact: true` and a `chain_count` that's ≥ the most recent snapshot's `chain_count` (chain only grows).

Snapshots are committed by the [Audit Chain Snapshot](.github/workflows/audit-head.yml) workflow daily.
