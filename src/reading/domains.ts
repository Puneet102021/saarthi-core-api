import type { Planet } from "../astrology/constants";

/*
  The relevance map: which parts of a chart answer which kind of question.
  This is the astrologer-maintained heart of question answering. Houses are
  counted from house 1 (the ascendant, or the Moon when the birth time is
  unknown). Primary houses decide the matter; secondary houses support it.
*/

export const DOMAIN_IDS = [
  "self",
  "career",
  "wealth",
  "marriage",
  "love",
  "children",
  "education",
  "health",
  "mind",
  "home",
  "mother",
  "father",
  "siblings",
  "travel",
  "spirituality",
  "disputes",
  "general"
] as const;

export type DomainId = (typeof DOMAIN_IDS)[number];

export type Varga = "D9" | "D10" | "D7";

export interface DomainDef {
  id: DomainId;
  label: string;
  primaryHouses: number[];
  secondaryHouses: number[];
  karakas: Planet[];
  varga?: Varga;
  keywords: RegExp;
}

export const DOMAINS: Record<DomainId, DomainDef> = {
  self: {
    id: "self",
    label: "personality and life direction",
    primaryHouses: [1],
    secondaryHouses: [5, 9],
    karakas: ["Sun", "Moon"],
    keywords: /\b(personality|nature|character|who am i|strengths?|weakness(es)?|purpose in life|confidence)\b/i
  },
  career: {
    id: "career",
    label: "career and work",
    primaryHouses: [10],
    secondaryHouses: [6, 2, 11],
    karakas: ["Sun", "Saturn", "Mercury", "Jupiter"],
    varga: "D10",
    keywords: /\b(career|jobs?|work|promotion|business|boss|office|profession|interview|startup|employ\w*|salary|appraisal|resign\w*|layoff)\b/i
  },
  wealth: {
    id: "wealth",
    label: "money and wealth",
    primaryHouses: [2, 11],
    secondaryHouses: [5, 9],
    karakas: ["Jupiter", "Venus"],
    keywords: /\b(money|wealth|financ\w*|income|savings?|invest\w*|loans?|debts?|rich|profit|loss(es)?|stocks?|gains?)\b/i
  },
  marriage: {
    id: "marriage",
    label: "marriage and partnership",
    primaryHouses: [7],
    secondaryHouses: [2, 11, 8],
    karakas: ["Venus", "Jupiter"],
    varga: "D9",
    keywords: /\b(marr\w*|spouse|husband|wife|wedding|divorce|in-?laws?|life partner|manglik|match(ing)?|kundli milan)\b/i
  },
  love: {
    id: "love",
    label: "love and romance",
    primaryHouses: [5],
    secondaryHouses: [7, 11],
    karakas: ["Venus", "Moon"],
    keywords: /\b(love|relationship|boyfriend|girlfriend|crush|dating|romance|breakup)\b/i
  },
  children: {
    id: "children",
    label: "children",
    primaryHouses: [5],
    secondaryHouses: [9, 11],
    karakas: ["Jupiter"],
    varga: "D7",
    keywords: /\b(child(ren)?|kids?|baby|pregnan\w*|son|daughter|conceiv\w*|fertility|progeny)\b/i
  },
  education: {
    id: "education",
    label: "education and learning",
    primaryHouses: [4, 5],
    secondaryHouses: [9, 2],
    karakas: ["Mercury", "Jupiter"],
    keywords: /\b(stud(y|ies)|exams?|education|college|degree|school|universit\w*|learning|admission|phd|masters|competitive|upsc|neet|jee)\b/i
  },
  health: {
    id: "health",
    label: "health and vitality",
    primaryHouses: [1, 6],
    secondaryHouses: [8, 12],
    karakas: ["Sun", "Moon", "Saturn"],
    keywords: /\b(health|ill(ness)?|disease|surgery|hospital|body|fitness|sick|pain|medical|recovery|operation)\b/i
  },
  mind: {
    id: "mind",
    label: "mind and emotional wellbeing",
    primaryHouses: [4, 1],
    secondaryHouses: [5],
    karakas: ["Moon", "Mercury"],
    keywords: /\b(stress|anxi\w*|peace|emotion\w*|depress\w*|mental|mood|overthink\w*|lonely|happiness|worry)\b/i
  },
  home: {
    id: "home",
    label: "home, property and vehicles",
    primaryHouses: [4],
    secondaryHouses: [2, 11],
    karakas: ["Mars", "Venus", "Moon"],
    keywords: /\b(house|home|property|land|flat|apartment|plot|vehicle|car|real estate|shift(ing)?)\b/i
  },
  mother: {
    id: "mother",
    label: "mother",
    primaryHouses: [4],
    secondaryHouses: [],
    karakas: ["Moon"],
    keywords: /\b(mother|mom|mum|maa)\b/i
  },
  father: {
    id: "father",
    label: "father",
    primaryHouses: [9],
    secondaryHouses: [10],
    karakas: ["Sun"],
    keywords: /\b(father|dad|papa)\b/i
  },
  siblings: {
    id: "siblings",
    label: "siblings",
    primaryHouses: [3],
    secondaryHouses: [11],
    karakas: ["Mars"],
    keywords: /\b(brothers?|sisters?|siblings?)\b/i
  },
  travel: {
    id: "travel",
    label: "travel and settling abroad",
    primaryHouses: [12, 9],
    secondaryHouses: [3, 7],
    karakas: ["Rahu", "Moon"],
    keywords: /\b(abroad|foreign|travel|visa|relocat\w*|settle|overseas|immigra\w*|onsite|green card)\b/i
  },
  spirituality: {
    id: "spirituality",
    label: "spirituality and purpose",
    primaryHouses: [9, 12],
    secondaryHouses: [5, 8],
    karakas: ["Ketu", "Jupiter"],
    keywords: /\b(spiritual\w*|meditat\w*|god|moksha|karma|dharma|religio\w*|pilgrimage|guru)\b/i
  },
  disputes: {
    id: "disputes",
    label: "disputes, legal matters and opponents",
    primaryHouses: [6],
    secondaryHouses: [8, 12],
    karakas: ["Mars", "Saturn"],
    keywords: /\b(court|legal|case|enem(y|ies)|dispute|litigation|conflict|lawsuit|police)\b/i
  },
  general: {
    id: "general",
    label: "life overall",
    primaryHouses: [1, 10, 7, 4],
    secondaryHouses: [9, 5],
    karakas: ["Moon", "Sun"],
    keywords: /$^/
  }
};

export function domainHouses(ids: DomainId[]): { primary: number[]; all: number[] } {
  const primary = new Set<number>();
  const all = new Set<number>();

  for (const id of ids) {
    for (const h of DOMAINS[id].primaryHouses) {
      primary.add(h);
      all.add(h);
    }
    for (const h of DOMAINS[id].secondaryHouses) all.add(h);
  }

  return { primary: [...primary], all: [...all] };
}
