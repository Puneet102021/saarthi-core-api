const DASHA_SEQUENCE = [
  "Ketu",
  "Venus",
  "Sun",
  "Moon",
  "Mars",
  "Rahu",
  "Jupiter",
  "Saturn",
  "Mercury"
];

const DASHA_YEARS: Record<string, number> = {
  Ketu: 7,
  Venus: 20,
  Sun: 6,
  Moon: 10,
  Mars: 7,
  Rahu: 18,
  Jupiter: 16,
  Saturn: 19,
  Mercury: 17
};

export interface AntardashaPeriod {
  mahadasha: string;
  planet: string;
  startDate: string;
  endDate: string;
  durationYears: number;
  isCurrent: boolean;
}

export function buildAntardashaTimeline({
  mahadashaPlanet,
  mahadashaStartDate,
  mahadashaEndDate
}: {
  mahadashaPlanet: string;
  mahadashaStartDate: Date;
  mahadashaEndDate: Date;
}): AntardashaPeriod[] {

  const startIndex =
    DASHA_SEQUENCE.indexOf(mahadashaPlanet);

  if (startIndex === -1) {
    throw new Error(
      `Invalid mahadasha planet: ${mahadashaPlanet}`
    );
  }

  const timeline: AntardashaPeriod[] = [];

  let runningDate =
    new Date(mahadashaStartDate.getTime());

  const now =
    new Date();

  for (let i = 0; i < 9; i++) {

    const planet =
      DASHA_SEQUENCE[
        (startIndex + i) % 9
      ];

    const durationYears =
      (
        DASHA_YEARS[mahadashaPlanet] *
        DASHA_YEARS[planet]
      ) / 120;

    const durationMs =
      durationYears *
      365.25 *
      24 *
      60 *
      60 *
      1000;

    let endDate =
      new Date(
        runningDate.getTime() +
        durationMs
      );

    if (
      endDate >
      mahadashaEndDate
    ) {
      endDate =
        new Date(
          mahadashaEndDate.getTime()
        );
    }

    timeline.push({
      mahadasha:
        mahadashaPlanet,

      planet,

      startDate:
        runningDate.toISOString(),

      endDate:
        endDate.toISOString(),

      durationYears:
        Number(
          durationYears.toFixed(3)
        ),

      isCurrent:
        now >= runningDate &&
        now <= endDate
    });

    runningDate =
      new Date(
        endDate.getTime()
      );

    if (
      runningDate >=
      mahadashaEndDate
    ) {
      break;
    }
  }

  return timeline;
}