# Saarthi Core API

A user asks a question; the API reads their Vedic birth chart for what bears on
that question, and a language model answers from that evidence.

```
question ─► intent ─► relevance map ─► chart evidence ─┐
                                       timing evidence ─┼─► rank & trim ─► model ─► cited answer
             stored natal chart (built once at onboarding)
```

## Endpoints

| Route | Auth | Purpose |
| --- | --- | --- |
| `POST /api/ask` | Bearer | `{ question, history? }` → `{ answer, evidenceUsed, evidence, followUps, intent, currentPeriod }` |
| `GET /api/chart` | Bearer | The user's natal chart, running dasha and current transits |
| `POST /api/chart/preview` | none, dev only | `{ birth }` → chart |
| `POST /api/ask/preview` | none, dev only | `{ birth, question, history?, dryRun?, now? }` → answer plus the full brief and prompt |

`birth` is `{ date: "YYYY-MM-DD", time: "HH:mm" | null, timezone: "Asia/Kolkata", latitude, longitude }`,
or `utcOffsetMinutes` in place of `timezone` (e.g. for local mean time).
`history` is the earlier turns, `[{ role: "user" | "assistant", content }]`.

The preview routes exist only when `ENABLE_DEV_ROUTES=true`. Never set it in production.

## Configuration

| Variable | Default | |
| --- | --- | --- |
| `OPENAI_API_KEY` | | required for `/api/ask` |
| `OPENAI_MODEL` | `gpt-4o-mini` | writes the answer; a stronger model cites more precisely |
| `OPENAI_INTENT_MODEL` | `OPENAI_MODEL` | reads the question |
| `AYANAMSA` | `lahiri` | `lahiri`, `raman` or `kp` |
| `NODE_TYPE` | `true` | `true` or `mean` node for Rahu/Ketu |
| `SWEPH_EPHE_PATH` | | Swiss Ephemeris data files; without them the built-in Moshier ephemeris is used (about 1″ for planets) |
| `ENABLE_DEV_ROUTES` | off | exposes the preview routes |

## The engine (`src/astrology`)

- **Time:** local birth time is converted to UTC using the place's IANA zone, including
  India's historical offsets (e.g. +06:30 in 1942-45). An unknown time is taken as noon, and
  houses are then counted from the Moon sign (Chandra lagna); ascendant-based yogas and
  divisional charts are left out.
- **Positions:** sidereal (Lahiri) planets and **sidereal** ascendant from Swiss Ephemeris;
  whole-sign houses.
- **Divisional charts:** D9, D10, D7.
- **Dignity:** exaltation, moolatrikona (with the shared Taurus/Virgo degree ranges), own sign,
  and five-fold friendship (natural + temporal).
- **Aspects:** graha drishti by sign (Mars 4/8, Jupiter 5/9, Saturn 3/10, nodes 5/9, all 7).
- **Functional nature** for the ascendant: yogakaraka, benefic, neutral, malefic; marakas.
- **Strength:** 0-100 from named components (dignity, house, dig bala, combustion,
  retrograde, vargottama, D9 dignity, paksha, benefic/malefic influence). It is a heuristic,
  not Shadbala, and every point is explained in `strength.reasons`.
- **Vimshottari:** mahadasha, antardasha and pratyantardasha at any date, with the birth
  mahadasha dated from before birth.
- **Transits:** sign ingresses found to the minute, gochara from the Moon, Sade Sati and
  Dhaiya, Jupiter-Saturn double transit.
- **Yogas and doshas:** Gajakesari, Budhaditya, Chandra-Mangala, Pancha Mahapurusha, Raja,
  Dharma-Karmadhipati, yogakaraka, Dhana, Viparita (Harsha/Sarala/Vimala), Neecha Bhanga,
  Parivartana, Kemadruma; Manglik (from ascendant, Moon and Venus, with exceptions), Kaal Sarp
  (both directions), Guru Chandal, Shrapit, Pitra, Chandra Grahan. Each carries its factors and
  cancellations; popular, non-BPHS combinations are flagged `modern`.

Bump `ENGINE_VERSION` in `src/astrology/chart.ts` whenever output changes, so stored charts
are rebuilt.

## Answering (`src/reading`)

- `domains.ts` is the relevance map: for each life area, its primary and secondary houses,
  natural significators and divisional chart. Tune readings here first.
- `intent.ts` reads the question (life areas, question type, time window, sensitivity), with
  the model or, without one, keywords. The code settles the window, not the model.
- `evidence.ts` and `timing.ts` turn the chart into short, scored statements: houses, their
  lords, significators, divisional chart, yogas; running and upcoming dasha periods tied to the
  question's houses; transits.
- `rank.ts` keeps the strongest 15 or so, weighted towards timing for "when" questions.
- `prompt.ts` holds the instructions. The model may interpret the evidence but not add chart
  facts or dates; citations to evidence it was not given are stripped.
- Questions that hint at self-harm get a support message with helplines, never a reading.

## Tests

```bash
npm test
```

They check the ephemeris against known values (Lahiri ayanamsa at J2000, sidereal
ascendant = tropical − ayanamsa), widely published Gochar dates (Saturn into Pisces
29 Mar 2025, Jupiter into Gemini 14 May 2025), a reference chart (M. K. Gandhi), dasha and
divisional-chart arithmetic, dignities, functional natures, yoga rules and the question
pipeline. They run without a database or an API key.
