# BookReady Keyword Research

Grounds the content queue in real search data instead of guessed `estVolume`.
This sits in front of the daily publisher: research finds and ranks real
keywords, you approve the winners, then they flow into `queue.json` and the
existing publisher writes them.

## The flow

```
SEEDS ──▶ keyword-research.mjs research ──▶ content/research/dataset-<date>.json
              (free autocomplete + paid volume/difficulty, deduped vs queue)
                              │
                              ▼
        keyword-research-prompt.md  (agent does live SERP + intent analysis,
        maps each winner to cluster / template / CTA / sections / faqs)
                              │
                              ▼
        content/queue.proposed.json  ──(you set approved:true)──▶  promote ──▶ queue.json
```

Two layers of data:

- **Free layer (always on).** Google Autocomplete (public JSON, no key) gives
  the real phrases people type, plus a relative `demandSignal` (0-100) from
  suggestion relevance and frequency. This is a ranking proxy, not a volume.
- **Paid layer (optional).** A swappable provider adds real monthly search
  volume + keyword difficulty. Default adapter: DataForSEO. Without a key the
  engine runs free-only and labels estimates as such.

## Commands

```bash
# Quick free preview of one seed
node content/keyword-research.mjs expand "salon booking software"

# Full pass over the default seeds -> dataset file
node content/keyword-research.mjs research --deep

# Research specific seeds
node content/keyword-research.mjs research --seeds "booksy alternative,salon no show"
node content/keyword-research.mjs research --seeds-file content/seeds.txt

# Score the EXISTING pending queue against real data (find ghost keywords)
node content/keyword-research.mjs audit

# Merge approved proposals into queue.json
node content/keyword-research.mjs promote
```

Flags: `--deep` (alphabet expansion, richer but slower), `--limit N` (cap the
dataset, default 80), `--no-cache` (skip the paid-API cache), `--gl us --hl en`
(locale).

## Turning a dataset into queue entries (the approve step)

1. Run `research`. It writes `content/research/dataset-<date>.json`, ranked by
   priority, already deduped against keywords your queue targets.
2. Hand the dataset to an agent using `content/keyword-research-prompt.md`. It
   does live SERP analysis on the top candidates and writes full queue entries
   (with a `research` provenance block and `"approved": false`) into
   `content/queue.proposed.json`.
3. Review `content/queue.proposed.json`. Set `"approved": true` on the keepers,
   delete or leave the rest.
4. Run `node content/keyword-research.mjs promote`. Approved entries are
   appended to `queue.json` as `status: "pending"`. The publisher takes it from
   there. Promote is idempotent: it skips slugs already in the queue.

## Adding the paid layer (DataForSEO)

DataForSEO is pay-as-you-go (no monthly minimum) and returns real Google search
volume + keyword difficulty. To turn it on, set two env vars before running:

```powershell
# PowerShell (current shell)
$env:DATAFORSEO_LOGIN = "you@example.com"
$env:DATAFORSEO_PASSWORD = "your-api-password"
node content/keyword-research.mjs research --deep
```

Once set, `research` and `audit` automatically fill `volume`, `difficulty`,
`cpc`, and `competition`, and the priority score switches from demand-signal to
real volume / difficulty. API responses are cached in
`content/research/.cache/` (gitignored) so re-runs do not re-bill.

### Swapping the provider

The provider is one isolated function. To use SerpApi or Keywords Everywhere
instead, implement `fetchMetrics(keywords) -> Map(kw -> {volume, difficulty,
cpc, competition})` in `keyword-research.mjs` and return it from
`getProvider()`. Nothing else changes.

## Notes

- `estVolume` is being retired as a guess. New entries carry a `research` block
  as the source of truth. Until a paid key is set, `estVolume` shows a
  free-signal estimate tagged `(free est)`.
- Seeds should stay buyer-relevant (competitor switches, category terms,
  operational pain), not vanity terms. Edit `DEFAULT_SEEDS` in the script.
- The drift filter drops autocomplete noise (off-topic homographs, foreign-geo
  modifiers) so the dataset is clean input. Tune the token sets in the script if
  a real keyword gets filtered.
- No em-dashes in any output, per the project style rule.
