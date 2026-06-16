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

const DASHA_YEARS:
  Record<string, number> = {

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

export interface MahadashaPeriod {

  planet: string;

  startDate: string;

  endDate: string;

  durationYears: number;

  isBirthDasha: boolean;

  isCurrent: boolean;
}

interface BuildMahadashaTimelineInput {

  birthMahadashaPlanet: string;

  birthDate: Date;

  balanceAtBirthYears: number;

  yearsToGenerate?: number;
}

export function buildMahadashaTimeline({

  birthMahadashaPlanet,

  birthDate,

  balanceAtBirthYears,

  yearsToGenerate = 120

}: BuildMahadashaTimelineInput):

  MahadashaPeriod[] {

  const timeline:
    MahadashaPeriod[] = [];

  /*
    Locate birth dasha
  */

  const birthIndex =
    DASHA_SEQUENCE.indexOf(
      birthMahadashaPlanet
    );

  if (
    birthIndex === -1
  ) {

    throw new Error(
      "Invalid birth mahadasha planet"
    );
  }

  /*
    Current running date
  */

  let runningDate =
    new Date(
      birthDate.getTime()
    );

  /*
    First dasha
    uses remaining balance
  */

  const firstDurationMs =

    balanceAtBirthYears *

    365.25 *

    24 *

    60 *

    60 *

    1000;

  const firstEndDate =
    new Date(

      runningDate.getTime() +
      firstDurationMs
    );

  timeline.push({

    planet:
      birthMahadashaPlanet,

    startDate:
      runningDate.toISOString(),

    endDate:
      firstEndDate.toISOString(),

    durationYears:
      Number(
        balanceAtBirthYears.toFixed(2)
      ),

    isBirthDasha: true,

    isCurrent: false
  });

  runningDate =
    new Date(
      firstEndDate.getTime()
    );

  /*
    Generate remaining sequence
  */

  let currentIndex =
    birthIndex;

  let generatedYears =
    balanceAtBirthYears;

  while (
    generatedYears <
    yearsToGenerate
  ) {

    currentIndex =
      (currentIndex + 1) % 9;

    const planet =
      DASHA_SEQUENCE[
        currentIndex
      ];

    const durationYears =
      DASHA_YEARS[
        planet
      ];

    const durationMs =

      durationYears *

      365.25 *

      24 *

      60 *

      60 *

      1000;

    const endDate =
      new Date(

        runningDate.getTime() +
        durationMs
      );

    timeline.push({

      planet,

      startDate:
        runningDate.toISOString(),

      endDate:
        endDate.toISOString(),

      durationYears,

      isBirthDasha: false,

      isCurrent: false
    });

    runningDate =
      new Date(
        endDate.getTime()
      );

    generatedYears +=
      durationYears;
  }

  /*
    Detect current dasha
  */

  const now =
    new Date();

  for (
    const period
    of timeline
  ) {

    const start =
      new Date(
        period.startDate
      );

    const end =
      new Date(
        period.endDate
      );

    if (

      now >= start &&
      now <= end
    ) {

      period.isCurrent =
        true;
    }
  }

  return timeline;
}