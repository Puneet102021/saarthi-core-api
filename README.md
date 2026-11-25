# Saarthi Core API

Saarthi is a companion people can talk to about what is going on in their lives. It reads
their Vedic birth chart for what bears on the message, uses everyday psychology to support
them, and offers simple, free remedies when things are hard. A language model writes the
reply, but only from the evidence and remedy options the engine hands it.

```
message ─► need & intent ─► relevance map ─► chart / daily evidence ─┐
                                              timing evidence ───────┼─► rank & trim ─► remedies ─► model ─► cited reply
  onboarding profile ─────────────────────────────────────────────────┘
  stored natal chart (built once at onboarding)          saved conversation history
```

## Endpoints

| Route | Auth | Purpose |
| --- | --- | --- |
| `POST /api/ask` | Bearer | `{ message, conversationId? }` → `{ conversationId, answer, need, evidenceUsed, evidence, remedies, followUps, intent, currentPeriod }` |
| `POST /api/ask/stream` | Bearer | `{ message }` → server-sent events: `start` (need, astrology level), `delta` ({ text }) as the reply is written, then `done` (the same result as `/api/ask`) or `error`. The web app uses this. |
| `GET /api/chat` | Bearer | `?before=<ISO>&limit=30`: a page of the person's one continuous chat |
| `DELETE /api/chat` | Bearer | Deletes the chat and its running summary |
| `GET /api/memory` | Bearer | What Saarthi remembers: long-term notes and the running summary |
| `DELETE /api/memory/facts/:id` | Bearer | Forgets one note |
| `DELETE /api/memory` | Bearer | Forgets everything (the chat stays) |
| `GET /api/chart` | Bearer | The user's natal chart, running dasha and current transits |
| `POST /api/chart/preview` | none, dev only | `{ birth }` → chart |
| `POST /api/ask/preview` | none, dev only | `{ birth, message, history?, profile?, memory?, lastMessageAt?, dryRun?, now? }` → answer plus the full brief, remedy options and prompt |

`birth` is `{ date: "YYYY-MM-DD", time: "HH:mm" | null, timezone: "Asia/Kolkata", latitude, longitude }`,
or `utcOffsetMinutes` in place of `timezone` (e.g. for local mean time).
Without `conversationId`, `/api/ask` starts a new conversation and returns its id; pass it on
later messages and the history is read from the database. `question` is still accepted in place
of `message`, and `history` (`[{ role: "user" | "assistant", content }]`) still seeds a new
conversation for older clients. Messages are capped at 2,000 characters.

The preview routes exist only when `ENABLE_DEV_ROUTES=true`. Never set it in production.

## Configuration

| Variable | Default | |
| --- | --- | --- |
| `OPENAI_API_KEY` | | required for `/api/ask` |
| `OPENAI_MODEL` | `gpt-5.4-mini` | writes the answer; reasoning models (o-series, GPT-5 and later) are detected automatically |
| `OPENAI_INTENT_MODEL` | `gpt-4.1` | reads the message (need, distress, new topic, astrology question); a non-reasoning model keeps it fast |
| `OPENAI_MEMORY_MODEL` | `gpt-4.1-mini` | keeps Saarthi's running summary and long-term notes, after replies |
| `OPENAI_REASONING_EFFORT` | `low` | `minimal`, `low`, `medium` or `high`, for reasoning answer models |
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

- **The need is inferred, never chosen.** `intent.ts` reads each message, with the recent
  turns and the onboarding `entryReason` as hints, and settles what the person needs right now:
  `support` (venting, wants to be heard), `guidance` (how to go forward on a matter),
  `support_guidance` (both), `daily` (a routine check-in) or `optimise` (making the most of a
  good time). It also flags `wantsRemedies` and `distress`. A conversation can move between
  needs from one message to the next.
- The need sets the evidence and its budget: support gets the mind (Moon, 4th) and the current
  period only, so a struggle is framed as a passing phase rather than a reading; daily gets
  `daily.ts` (today's Moon from the natal Moon, chandra bala, and tara bala); optimise favours
  what is supportive now.
- `profile.ts` turns the onboarding answers (focus, how they handle pressure, what they feel
  misunderstood for, why they came) into an `ABOUT THE PERSON` block that shapes tone, never chart
  facts.
- `remedies.ts` is the remedy catalogue: practical, psychological and optional traditional
  practices for each planet, plus general ones. They are offered when the person is struggling,
  asks, or the evidence is mostly challenging; framed as "strengthen" in good times; at most one
  on a difficult day. No gemstones, paid rituals or purchases. Tune remedies here.
- `domains.ts` is the relevance map: for each life area, its primary and secondary houses,
  natural significators and divisional chart. Tune readings here first.
- `intent.ts` reads the question (life areas, question type, time window, sensitivity), with
  the model or, without one, keywords. The code settles the window, not the model.
- `evidence.ts` and `timing.ts` turn the chart into short, scored statements: houses, their
  lords, significators, divisional chart, yogas; running and upcoming dasha periods tied to the
  question's houses; transits.
- `rank.ts` keeps the strongest 15 or so, weighted towards timing for "when" questions.
- `prompt.ts` holds the instructions: acknowledge first, then meet the need; chart as weather,
  not fate. The model may interpret the evidence but not add chart facts or dates, and may only
  suggest remedies it was offered; citations ([E#], [R#]) to anything it was not given are
  stripped.
- Messages that show distress get grounding first and a gentle pointer to Tele-MANAS (14416).
- Questions that hint at self-harm get a support message with helplines, never a reading.

## How Saarthi talks

Saarthi is modelled on a friend you want to keep talking to: it reacts honestly, mirrors the
person's exact details and does something with them, shows understanding through knowledge
rather than advice, names what an experience meant, calls back their words, and ends with one
concrete question about what happened next. It gives no tips unless asked (or in distress),
and length follows the person's message.

- **Needs** (`intent.ts`): `share` (a story, an update, small talk), `support`, `guidance`,
  `support_guidance`, `daily`, `optimise`, inferred each turn, never chosen by the person.
- **Astrology is never an offer.** Each turn gets a level: `none` for most turns (the model is
  given no chart at all), `subtle` when they ask why or when (at most one plain sentence, no
  planet names, then three turns without), or `full` when they ask about the astrology itself.
- **Measuring it:** `npx tsx scripts/eval-conversations.ts <report.md> [label] [--stream]`
  runs six scripted conversations (including a long story told in short messages) and has a
  judge model score every reply on specificity, one good question, no unsolicited advice,
  astrology fit, length, warmth and "would they want to reply". Run it before and after any
  prompt change.

## Memory (`src/memory`)

Saarthi remembers in three layers, like a friend would:

- **Short-term:** the latest messages, word for word (at least 12).
- **Running:** a short summary of what has been talked about lately. Once four or more
  messages have left the short-term window, they are folded into it in the background,
  after the reply is sent.
- **Long-term:** lasting notes about the person (people, work, life, experiences they have
  told Saarthi about with a phrase in their own words, events with dates, patterns, what helps,
  goals, preferences), added, updated and removed by the same step.
  Never contact details, numbers or astrology. People can see and delete them under
  Settings.

`core.ts` is the pure logic (what to fold, validating note changes, how memory reads in
the brief); `store.ts` does the database and model calls.

## Tests

```bash
npm test
```

They check the ephemeris against known values (Lahiri ayanamsa at J2000, sidereal
ascendant = tropical − ayanamsa), widely published Gochar dates (Saturn into Pisces
29 Mar 2025, Jupiter into Gemini 14 May 2025), a reference chart (M. K. Gandhi), dasha and
divisional-chart arithmetic, dignities, functional natures, yoga rules and the question
pipeline. They run without a database or an API key.

