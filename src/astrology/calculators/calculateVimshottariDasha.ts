const NAKSHATRA_LORDS = [

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

const NAKSHATRAS = [

  "Ashwini",
  "Bharani",
  "Krittika",
  "Rohini",
  "Mrigashira",
  "Ardra",
  "Punarvasu",
  "Pushya",
  "Ashlesha",
  "Magha",
  "Purva Phalguni",
  "Uttara Phalguni",
  "Hasta",
  "Chitra",
  "Swati",
  "Vishakha",
  "Anuradha",
  "Jyeshtha",
  "Mula",
  "Purva Ashadha",
  "Uttara Ashadha",
  "Shravana",
  "Dhanishta",
  "Shatabhisha",
  "Purva Bhadrapada",
  "Uttara Bhadrapada",
  "Revati"
];

const NAKSHATRA_SPAN =
  360 / 27;

export interface Mahadasha {

  planet: string;

  startDate: string;

  endDate: string;

  durationYears: number;

  remainingYears: number;

  elapsedYears: number;

  balanceAtBirthYears: number;
}

export interface VimshottariDasha {

  birthNakshatra: string;

  currentMahadasha: Mahadasha;
}

interface CalculateVimshottariInput {

  moonLongitude: number;

  moonNakshatra: string;

  birthDate: Date;
}

export function calculateVimshottariDasha({

  moonLongitude,

  moonNakshatra,

  birthDate

}: CalculateVimshottariInput):

  VimshottariDasha {

  /*
    Safety
  */

  if (
    Number.isNaN(
      moonLongitude
    )
  ) {

    throw new Error(
      "Invalid moon longitude"
    );
  }

  /*
    Normalize longitude
  */

  const normalizedLongitude =

    (
      (
        moonLongitude % 360
      ) + 360
    ) % 360;

  /*
    Nakshatra index
  */

  const nakshatraIndex =
    NAKSHATRAS.indexOf(
      moonNakshatra
    );

  if (
    nakshatraIndex === -1
  ) {

    throw new Error(
      `Invalid nakshatra: ${moonNakshatra}`
    );
  }

  /*
    Dasha lord
  */

  const lordIndex =
    nakshatraIndex % 9;

  const mahadashaPlanet =
    NAKSHATRA_LORDS[
      lordIndex
    ];

  /*
    Duration
  */

  const durationYears =
    DASHA_YEARS[
      mahadashaPlanet
    ];

  /*
    Nakshatra boundaries
  */

  const nakshatraStart =

    nakshatraIndex *
    NAKSHATRA_SPAN;

  const nakshatraEnd =

    nakshatraStart +
    NAKSHATRA_SPAN;

  /*
    Progress inside nakshatra
  */

  const progressInNakshatra =

    normalizedLongitude -
    nakshatraStart;

  const completedFraction =

    progressInNakshatra /
    NAKSHATRA_SPAN;

  const remainingFraction =

    1 -
    completedFraction;

  /*
    Safety clamp
  */

  const safeRemainingFraction =

    Math.min(
      Math.max(
        remainingFraction,
        0
      ),
      1
    );

  /*
    Balance
  */

  const balanceAtBirthYears =
    Number(

      (
        durationYears *
        safeRemainingFraction
      ).toFixed(2)
    );

  /*
    Dates
  */

  const startDate =
    new Date(
      birthDate
    );

  if (
    Number.isNaN(
      startDate.getTime()
    )
  ) {

    throw new Error(
      "Invalid birth date"
    );
  }

  const durationMs =

    balanceAtBirthYears *

    365.25 *

    24 *

    60 *

    60 *

    1000;

  const endDate =
    new Date(

      startDate.getTime() +
      durationMs
    );

  /*
    Safety
  */

  if (
    Number.isNaN(
      endDate.getTime()
    )
  ) {

    throw new Error(
      "Invalid end date"
    );
  }

  /*
    Current timing
  */

  const now =
    new Date();

  const elapsedYears =
    Number(

      (
        (
          now.getTime() -
          startDate.getTime()
        ) /

        (
          1000 *
          60 *
          60 *
          24 *
          365.25
        )

      ).toFixed(2)
    );

  const remainingYears =
    Number(

      (
        (
          endDate.getTime() -
          now.getTime()
        ) /

        (
          1000 *
          60 *
          60 *
          24 *
          365.25
        )

      ).toFixed(2)
    );

  return {

    birthNakshatra:
      moonNakshatra,

    currentMahadasha: {

      planet:
        mahadashaPlanet,

      startDate:
        startDate.toISOString(),

      endDate:
        endDate.toISOString(),

      durationYears,

      remainingYears,

      elapsedYears,

      balanceAtBirthYears
    }
  };
}