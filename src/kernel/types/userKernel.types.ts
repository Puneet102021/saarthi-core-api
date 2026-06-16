export interface UserKernel {

  userId: string;

  generatedAt: string;

  chart: ChartKernel;

  timeline: TimelineKernel;

  structures: StructuresKernel;

  planetaryState: PlanetaryStateKernel;

  themes: ThemesKernel;
}

export interface ChartKernel {

  ascendant: string;

  lagnesh: string;

  sunSign: string;

  moonSign: string;

  nakshatra: string;

  planets: any[];

  houses: any[];
}

export interface TimelineKernel {

  mahadasha: string;

  antardasha: string;

  currentFocus: string;

  currentPeriodStart?: string;

  currentPeriodEnd?: string;
}

export interface StructuresKernel {

  yogas: any[];

  doshas: any[];

  dominantPatterns: any[];
}

export interface PlanetaryStateKernel {

  supportive: any[];

  challenging: any[];

  neutral: any[];
}

export interface ThemesKernel {

  career: string[];

  relationships: string[];

  finance: string[];

  health: string[];

  spirituality: string[];
}