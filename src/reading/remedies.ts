import { planetIn } from "../astrology/chart";
import type { Planet } from "../astrology/constants";
import { dashaAt } from "../astrology/dasha";
import type { NatalChart } from "../astrology/types";
import type { Evidence } from "./evidence";
import type { QuestionIntent } from "./intent";
import { lordPolarity } from "./timing";

/*
  The remedy catalogue: the only remedies Saarthi may suggest. Each ties a
  planet's themes to something concrete and free. Practical and psychological
  practices come first; traditional ones are optional and never sold. No
  gemstones, paid rituals or purchases, and no promise that a practice
  changes fate. Tune remedies here, as readings are tuned in domains.ts.
*/

export type RemedyKind = "practical" | "psychological" | "traditional";

export interface Remedy {
  id: string;
  planet: Planet | null;
  kind: RemedyKind;
  title: string;
  practice: string;
  /* How the practice works with the planet's theme. Not a causal promise. */
  why: string;
  /* How to use the same theme when the planet is supportive, for good times. */
  strengthen?: string;
}

export const REMEDIES: Remedy[] = [
  /* Sun: vitality, self-confidence, authority, father */
  {
    id: "sun-morning",
    planet: "Sun",
    kind: "practical",
    title: "A steady morning start",
    practice: "Get up at a fixed time and spend ten minutes in morning daylight, walking or stretching.",
    why: "The Sun stands for vitality and confidence; a dependable start to the day builds both.",
    strengthen: "Use this energy to take visible responsibility: lead one thing at work or at home this month."
  },
  {
    id: "sun-own-it",
    planet: "Sun",
    kind: "practical",
    title: "Own one decision",
    practice: "Make one decision you have been waiting on someone else's approval for, and own the result.",
    why: "Sun themes are authority and self-direction; small acts of ownership rebuild them."
  },
  {
    id: "sun-worth",
    planet: "Sun",
    kind: "psychological",
    title: "Notice your own worth",
    practice: "Each night write one thing you handled well today, however small. Notice where your worth hangs on others' praise.",
    why: "The Sun is self-worth and recognition; this moves the source of it back to you."
  },
  {
    id: "sun-traditional",
    planet: "Sun",
    kind: "traditional",
    title: "Morning offering to the Sun (optional)",
    practice: "If it feels right, offer water to the rising Sun, or recite the Gayatri mantra or Aditya Hridayam in the morning.",
    why: "A traditional Sun practice; its value is a calm, purposeful few minutes at the start of the day."
  },

  /* Moon: mind, emotions, mother, nourishment */
  {
    id: "moon-sleep",
    planet: "Moon",
    kind: "practical",
    title: "Protect sleep and rhythm",
    practice: "Keep the same bedtime, put screens away 30 minutes before, and drink enough water through the day.",
    why: "The Moon governs the mind and body rhythms; a settled routine steadies mood.",
    strengthen: "Use the emotional openness of this time to deepen one close relationship."
  },
  {
    id: "moon-connect",
    planet: "Moon",
    kind: "practical",
    title: "Time with someone who cares for you",
    practice: "Call or spend unhurried time with your mother, or with someone who makes you feel looked after.",
    why: "The Moon is nourishment and the mother; feeling cared for is its natural support."
  },
  {
    id: "moon-name-it",
    planet: "Moon",
    kind: "psychological",
    title: "Name the feeling",
    practice: "When a feeling swells, name it ('this is worry', 'this is hurt') and take ten slow breaths before acting on it.",
    why: "The Moon is emotion; putting a feeling into words is a well-studied way to loosen its grip."
  },
  {
    id: "moon-traditional",
    planet: "Moon",
    kind: "traditional",
    title: "Monday practice (optional)",
    practice: "On Mondays, chant 'Om Somaya Namah' or 'Om Namah Shivaya' 11 or 108 times, or give milk, rice or water to someone who needs it.",
    why: "A traditional Moon practice; repetition and giving both calm a restless mind."
  },

  /* Mars: energy, courage, conflict */
  {
    id: "mars-move",
    planet: "Mars",
    kind: "practical",
    title: "Move the restless energy",
    practice: "Do 30 minutes of brisk exercise most days: running, a sport, anything that tires the body.",
    why: "Mars is raw energy; used in the body, it is less likely to come out as anger or accidents.",
    strengthen: "Channel this drive into the one bold step you have been putting off."
  },
  {
    id: "mars-first-twenty",
    planet: "Mars",
    kind: "practical",
    title: "Start the hard thing",
    practice: "Pick the task you are avoiding and do only the first 20 minutes of it today.",
    why: "Mars is courage; starting is where courage is built."
  },
  {
    id: "mars-pause",
    planet: "Mars",
    kind: "psychological",
    title: "Pause before you react",
    practice: "When anger rises, step away for ten minutes before replying; then respond calmly or in writing.",
    why: "Mars brings heat and conflict; a short pause keeps the energy and drops the damage."
  },
  {
    id: "mars-traditional",
    planet: "Mars",
    kind: "traditional",
    title: "Tuesday practice (optional)",
    practice: "On Tuesdays, recite the Hanuman Chalisa, or give food to someone who does hard physical work.",
    why: "A traditional Mars practice that turns its energy towards strength and service."
  },

  /* Mercury: intellect, communication, skills */
  {
    id: "mercury-list",
    planet: "Mercury",
    kind: "practical",
    title: "Three things, first one first",
    practice: "Write a three-item list each morning and finish the first item before checking messages.",
    why: "Mercury is the organising mind; a short list turns scattered thinking into progress.",
    strengthen: "Use this sharp phase to learn, write, pitch or negotiate something that matters."
  },
  {
    id: "mercury-learn",
    planet: "Mercury",
    kind: "practical",
    title: "Twenty minutes of learning",
    practice: "Spend 20 minutes a day on a skill that helps your work.",
    why: "Mercury rules skills and learning; steady practice is its natural remedy."
  },
  {
    id: "mercury-thought-check",
    planet: "Mercury",
    kind: "psychological",
    title: "Put the worry on paper",
    practice: "Write the worrying thought down, then the evidence for it and against it. Decide from the page, not the loop.",
    why: "Mercury is thought itself; examining a thought is the core of cognitive therapy for overthinking."
  },
  {
    id: "mercury-traditional",
    planet: "Mercury",
    kind: "traditional",
    title: "Wednesday practice (optional)",
    practice: "On Wednesdays, chant 'Om Budhaya Namah' or the Vishnu Sahasranama, or give books or stationery to a student.",
    why: "A traditional Mercury practice tied to learning and clear speech."
  },

  /* Jupiter: wisdom, teachers, guidance, growth */
  {
    id: "jupiter-mentor",
    planet: "Jupiter",
    kind: "practical",
    title: "Seek or share wisdom",
    practice: "Ask someone wiser for advice on what you are facing, or teach someone what you know.",
    why: "Jupiter is the teacher; guidance flows both ways.",
    strengthen: "Mentor someone or support a good cause; growth now multiplies when it is shared."
  },
  {
    id: "jupiter-word",
    planet: "Jupiter",
    kind: "practical",
    title: "Keep small promises",
    practice: "For a week, keep every small promise you make, and make fewer of them.",
    why: "Jupiter is integrity and trust; reliability is how its blessings are earned."
  },
  {
    id: "jupiter-gratitude",
    planet: "Jupiter",
    kind: "psychological",
    title: "Specific gratitude",
    practice: "Each night write three specific things that went well and why.",
    why: "Jupiter is optimism and faith; this exercise is shown to lift mood over a few weeks."
  },
  {
    id: "jupiter-traditional",
    planet: "Jupiter",
    kind: "traditional",
    title: "Thursday practice (optional)",
    practice: "On Thursdays, chant 'Om Brihaspataye Namah', or support a teacher or a child's education.",
    why: "A traditional Jupiter practice of respect for learning and teachers."
  },

  /* Venus: love, comfort, beauty, relationships */
  {
    id: "venus-together",
    planet: "Venus",
    kind: "practical",
    title: "Unhurried time together",
    practice: "Plan one phone-free hour with your partner or a close friend this week.",
    why: "Venus is love and companionship; attention is what relationships live on.",
    strengthen: "Invest in a relationship or a creative project now; Venus rewards care and craft."
  },
  {
    id: "venus-pleasure",
    planet: "Venus",
    kind: "practical",
    title: "A little beauty, without guilt",
    practice: "Give 20 minutes a day to something beautiful: music, cooking, art, tidying your space.",
    why: "Venus is comfort and beauty; small pleasures restore it."
  },
  {
    id: "venus-boundary",
    planet: "Venus",
    kind: "psychological",
    title: "One kind, clear no",
    practice: "Notice where you say yes only to keep the peace, and practise one kind, clear no this week.",
    why: "Venus is harmony; real harmony needs honest boundaries."
  },
  {
    id: "venus-traditional",
    planet: "Venus",
    kind: "traditional",
    title: "Friday practice (optional)",
    practice: "On Fridays, chant 'Om Shukraya Namah' or offer white flowers at a temple, or support a girl's education.",
    why: "A traditional Venus practice of grace and generosity."
  },

  /* Saturn: discipline, delay, labour, service */
  {
    id: "saturn-routine",
    planet: "Saturn",
    kind: "practical",
    title: "A fixed daily routine",
    practice: "Wake, work and sleep at the same times every day, even when results are slow.",
    why: "Saturn rewards patience and structure; routine is how a slow period is carried.",
    strengthen: "Build something durable now: a habit, a savings plan, a skill; Saturn's gains last."
  },
  {
    id: "saturn-finish",
    planet: "Saturn",
    kind: "practical",
    title: "Finish one postponed task",
    practice: "Finish one task you have been postponing this week, however dull.",
    why: "Saturn is duty and delay; clearing what is pending eases its weight."
  },
  {
    id: "saturn-control",
    planet: "Saturn",
    kind: "psychological",
    title: "In my control, not in my control",
    practice: "Make two lists: what is in your control and what is not. Put your energy only into the first.",
    why: "Saturn brings limits; accepting them and acting within them is its lesson."
  },
  {
    id: "saturn-traditional",
    planet: "Saturn",
    kind: "traditional",
    title: "Saturday service (optional)",
    practice: "On Saturdays, serve or give to elderly people or labourers, or chant 'Om Shanaishcharaya Namah' 108 times.",
    why: "A traditional Saturn practice; service is Saturn's own signification."
  },

  /* Rahu: ambition, obsession, the unconventional */
  {
    id: "rahu-one-habit",
    planet: "Rahu",
    kind: "practical",
    title: "Break one compulsive habit",
    practice: "For one week, cut a compulsive habit: doom-scrolling, late nights or impulse spending. Notice the difference.",
    why: "Rahu is craving and obsession; loosening one habit loosens its pull.",
    strengthen: "Use this ambitious phase for one unconventional, well-planned bet, not many."
  },
  {
    id: "rahu-reality",
    planet: "Rahu",
    kind: "psychological",
    title: "Facts before the leap",
    practice: "Before a big move, write what you actually know, then what you fear or fantasise. Decide from the first list.",
    why: "Rahu magnifies and distorts; separating fact from projection keeps you grounded."
  },
  {
    id: "rahu-traditional",
    planet: "Rahu",
    kind: "traditional",
    title: "Rahu practice (optional)",
    practice: "On Saturdays, chant 'Om Rahave Namah' or a Durga mantra, or feed stray dogs.",
    why: "A traditional Rahu practice that steadies restlessness."
  },

  /* Ketu: detachment, loss, spirituality */
  {
    id: "ketu-quiet",
    planet: "Ketu",
    kind: "practical",
    title: "Ten quiet minutes",
    practice: "Sit quietly or walk slowly without your phone for ten minutes a day.",
    why: "Ketu turns attention inward; quiet time gives it somewhere healthy to go.",
    strengthen: "Deepen a spiritual or research practice now; insight comes easily."
  },
  {
    id: "ketu-let-go",
    planet: "Ketu",
    kind: "psychological",
    title: "Write about what is ending",
    practice: "Write about what you have lost or are letting go of and what it taught you, then name one thing you still want to build.",
    why: "Ketu is loss and release; making meaning of it turns emptiness into direction."
  },
  {
    id: "ketu-traditional",
    planet: "Ketu",
    kind: "traditional",
    title: "Ketu practice (optional)",
    practice: "On Tuesdays, chant 'Om Ketave Namah' or pray to Ganesha, or help at an animal shelter.",
    why: "A traditional Ketu practice for clarity and new beginnings."
  },

  /* General, for any chart */
  {
    id: "general-breath",
    planet: null,
    kind: "psychological",
    title: "Slow breathing",
    practice: "Breathe in for 4 counts and out for 6, for five minutes, whenever the mind races.",
    why: "Longer out-breaths calm the nervous system; it works within minutes."
  },
  {
    id: "general-reach-out",
    planet: null,
    kind: "practical",
    title: "Tell one person",
    practice: "Tell one person you trust what you are going through, this week.",
    why: "Carrying something alone makes it heavier; being heard is protective."
  },
  {
    id: "general-small-step",
    planet: null,
    kind: "practical",
    title: "One small step",
    practice: "Pick one step you can finish today, do it, and count it as progress.",
    why: "Small wins rebuild a sense of control when bigger things feel stuck."
  },
  {
    id: "general-journal",
    planet: null,
    kind: "psychological",
    title: "Ten minutes of writing",
    practice: "At night, write for ten minutes: what happened, how you felt, what you need tomorrow.",
    why: "Expressive writing helps sort feelings and is linked to lower stress."
  }
];

export interface OfferedRemedy extends Remedy {
  /* R1, R2, ...: how the model cites it. */
  ref: string;
  framing: "ease" | "strengthen";
}

const MAX_OFFERED = 8;
const KIND_ORDER: RemedyKind[] = ["practical", "psychological", "traditional"];

function forPlanet(planet: Planet, framing: "ease" | "strengthen"): Remedy[] {
  const own = REMEDIES.filter((r) => r.planet === planet).sort(
    (a, b) => KIND_ORDER.indexOf(a.kind) - KIND_ORDER.indexOf(b.kind)
  );

  if (framing === "strengthen") {
    return [...own.filter((r) => r.strengthen), ...own.filter((r) => r.kind === "traditional")];
  }

  /* One of each kind, practical first. */
  return KIND_ORDER.map((kind) => own.find((r) => r.kind === kind)).filter((r): r is Remedy => Boolean(r));
}

const general = (...ids: string[]) => REMEDIES.filter((r) => ids.includes(r.id));

function isCurrent(e: Evidence, now: Date): boolean {
  return !e.timeframe || (Date.parse(e.timeframe.start) <= now.getTime() && Date.parse(e.timeframe.end) >= now.getTime());
}

function lordFromEvidence(chart: NatalChart, e: Evidence): Planet | null {
  const house = /^lord:(\d+)$/.exec(e.key);
  return house ? chart.houses[Number(house[1]) - 1].lord : null;
}

/* Which remedies to offer the model for this answer, if any. */
export function selectRemedies(
  chart: NatalChart,
  evidence: Evidence[],
  intent: QuestionIntent,
  now: Date,
  { firstReading = false }: { firstReading?: boolean } = {}
): OfferedRemedy[] {
  const struggling = intent.need === "support" || intent.need === "support_guidance" || intent.sensitive === "distress";

  const scored = evidence.filter((e) => e.kind !== "caveat" && e.polarity !== "neutral");
  const challengingShare = scored.length
    ? scored.filter((e) => e.polarity === "challenging").length / scored.length
    : 0;

  const running = dashaAt(chart.dasha.mahadashas, now);
  const dashaLords = running ? [running.mahadasha.lord, running.antardasha.lord] : [];

  let framing: "ease" | "strengthen" = "ease";
  const planets: Planet[] = [];
  let extras: Remedy[] = [];

  const add = (p: Planet | null) => {
    if (p && !planets.includes(p) && planets.length < 2) planets.push(p);
  };

  /* While they are telling you something, a friend listens; tips only if they ask. */
  if (intent.need === "share" && !intent.wantsRemedies) return [];

  if (intent.need === "daily") {
    /* At most one small practice, and only on a difficult day. */
    const hardDay = evidence.some((e) => e.key.startsWith("daily:") && e.polarity === "challenging");
    if (!hardDay && !intent.wantsRemedies) return [];
    /* One calming option and nothing else: a check-in is not a programme. */
    return [{ ...REMEDIES.find((r) => r.id === "moon-name-it")!, ref: "R1", framing: "ease" }];
  } else if (!firstReading && !intent.wantsRemedies && intent.sensitive !== "distress") {
    /* In the flow of conversation a friend doesn't keep handing out tips; only when asked or when it's hard. */
    return [];
  } else if (intent.need === "optimise" && !struggling) {
    framing = "strengthen";

    for (const lord of dashaLords) {
      if (lordPolarity(planetIn(chart, lord)) === "supportive") add(lord);
    }

    const strongLords = evidence
      .filter((e) => e.kind === "lord" && e.polarity === "supportive")
      .map((e) => lordFromEvidence(chart, e))
      .filter((p): p is Planet => Boolean(p))
      .sort((a, b) => planetIn(chart, b).strength.score - planetIn(chart, a).strength.score);
    strongLords.forEach(add);

    if (!planets.length) add("Jupiter");
  } else if (intent.wantsRemedies || struggling || firstReading || challengingShare >= 0.6) {
    for (const lord of dashaLords) {
      if (lordPolarity(planetIn(chart, lord)) === "challenging") add(lord);
    }

    if (evidence.some((e) => e.key.startsWith("saturn:") && isCurrent(e, now))) add("Saturn");

    const weakLords = evidence
      .filter((e) => e.kind === "lord" && e.polarity === "challenging")
      .map((e) => lordFromEvidence(chart, e))
      .filter((p): p is Planet => Boolean(p))
      .sort((a, b) => planetIn(chart, a).strength.score - planetIn(chart, b).strength.score);
    weakLords.forEach(add);

    /* Nothing clearly difficult in the chart: the mind (Moon) is still where support starts. */
    if (!planets.length) add("Moon");

    extras =
      intent.sensitive === "distress"
        ? general("general-breath", "general-reach-out")
        : general("general-small-step", "general-journal");
  } else {
    return [];
  }

  const chosen = [...planets.flatMap((p) => forPlanet(p, framing)), ...extras].slice(0, MAX_OFFERED);

  return chosen.map((r, i) => ({ ...r, ref: `R${i + 1}`, framing }));
}
