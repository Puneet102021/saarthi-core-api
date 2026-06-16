import { Request, Response } from "express";

import {
  calculatePlanetaryPositions
} from "../astrology/calculators/calculatePlanetaryPositions";

import {
  calculateAscendant
} from "../astrology/calculators/calculateAscendant";

import {
  calculateVimshottariDasha
} from "../astrology/calculators/calculateVimshottariDasha";

import {
  buildHouses
} from "../astrology/builders/buildHouses";

import {
  mapPlanetsToHouses
} from "../astrology/builders/mapPlanetsToHouses";

import {
  detectConjunctions
} from "../astrology/engines/detectConjunctions";

import {
  detectHouseClusters
} from "../astrology/engines/detectHouseClusters";

import {
  detectSignClusters
} from "../astrology/engines/detectSignClusters";

import {
  detectPlanetaryAspects
} from "../astrology/engines/detectPlanetaryAspects";

import {
  buildPlanetaryConditionTags
} from "../astrology/engines/buildPlanetaryConditionTags";

import {
  detectDominantPatterns
} from "../astrology/engines/detectDominantPatterns";

import {
  buildSignLords
} from "../astrology/engines/buildSignLords";

import {
  buildHouseLords
} from "../astrology/engines/buildHouseLords";

import {
  buildDispositorChains
} from "../astrology/engines/buildDispositorChains";

import {
  buildFunctionalRoles
} from "../astrology/engines/buildFunctionalRoles";

import {
  buildPlanetDignities
} from "../astrology/engines/buildPlanetDignities";

import {
  buildVedicDrishti
} from "../astrology/engines/buildVedicDrishti";

import {
  buildReinforcementGraph
} from "../astrology/engines/buildReinforcementGraph";

import {
  buildAxisActivations
} from "../astrology/engines/buildAxisActivations";

import {
  buildPlanetaryState
} from "../astrology/engines/buildPlanetaryState";

import {
  buildSupportTensionGraph
} from "../astrology/engines/buildSupportTensionGraph";

import {
  buildMahadashaTimeline
} from "../astrology/engines/buildMahadashaTimeline";

import {
  buildAntardashaTimeline
} from "../astrology/engines/buildAntardashaTimeline";

import {
  buildTransitActivations
} from "../astrology/engines/buildTransitActivations";

import {
  calculateTransitPositions
} from "../astrology/calculators/calculateTransitPositions";

import {
  buildActivationPriority
} from "../astrology/engines/buildActivationPriority";

import {
  buildFullReadingOrchestrator
} from "../orchestration/fullReading/fullReadingOrchestrator";

import {
  evaluateYogaDoshaEngine
} from "../astrology/yogaDosha/yogaDoshaEngine";

import {
  symbolicEvaluator
} from "../astrology/evaluation/symbolicEvaluator";

import {
  buildHouseActivations
} from "../astrology/engines/buildHouseActivations";

export async function getRawChart(
  req: Request,
  res: Response
) {

  try {

    const year =
      Number(req.query.year);

    const month =
      Number(req.query.month);

    const day =
      Number(req.query.day);

    const hour =
      Number(req.query.hour);

    if (

      !year ||
      !month ||
      !day ||

      Number.isNaN(hour)
    ) {

      return res.status(400).json({

        success: false,

        error:
          "Missing required query params"
      });
    }

    const result =
      await calculatePlanetaryPositions(

        year,
        month,
        day,
        hour
      );

    return res.json({

      success: true,

      data: result
    });

  } catch (error: any) {

    console.error(
      "RAW_CHART_ERROR",
      error
    );

    return res.status(500).json({

      success: false,

      error:
        error?.message ||
        "Internal server error"
    });
  }
}

export async function getHouseTest(
  req: Request,
  res: Response
) {

  try {

    /*
      Query params
    */

    const year =
      Number(req.query.year);

    const month =
      Number(req.query.month);

    const day =
      Number(req.query.day);

    const hour =
      Number(req.query.hour);

    const latitude =
      Number(req.query.latitude);

    const longitude =
      Number(req.query.longitude);

    /*
      Validation
    */

    if (

      !year ||
      !month ||
      !day ||

      Number.isNaN(hour) ||

      Number.isNaN(latitude) ||

      Number.isNaN(longitude)
    ) {

      return res.status(400).json({

        success: false,

        error:
          "Invalid query parameters"
      });
    }

    /*
      Planetary positions
    */

    const planetaryPositions =
      await calculatePlanetaryPositions(

        year,
        month,
        day,
        hour
      );

    /*
      Ascendant
    */

    const ascendant =
      calculateAscendant({

        julianDay:
          planetaryPositions.julianDay,

        latitude,

        longitude
      });

    /*
      Houses
    */

    const houses =
      buildHouses(
        ascendant.sign
      );

    /*
      Placements
    */

    const placements =
      mapPlanetsToHouses(

        planetaryPositions.planets,

        houses
      );

      const houseActivations =
  buildHouseActivations(
    placements
  );

    /*
      Conjunctions
    */

    const conjunctions =
      detectConjunctions({

        planets:
          planetaryPositions.planets,

        placements,

        maxOrb: 8
      });

    /*
      Clusters
    */

    const houseClusters =
      detectHouseClusters(
        placements
      );

    const signClusters =
      detectSignClusters(
        planetaryPositions.planets
      );

    /*
      Aspects
    */

    const planetaryAspects =
      detectPlanetaryAspects(
        planetaryPositions.planets
      );

    /*
      Condition tags
    */

    const planetaryConditionTags =
      buildPlanetaryConditionTags(

        planetaryPositions.planets,

        placements,

        planetaryAspects
      );

    /*
      Dominant patterns
    */

    const dominantPatterns =
      detectDominantPatterns({

        houseClusters,

        signClusters,

        conjunctions,

        aspects:
          planetaryAspects
      });

    /*
      Lords
    */

    const signLords =
      buildSignLords();

    const houseLords =
      buildHouseLords(

        houses,

        placements
      );

    /*
      Dispositor chains
    */

    const dispositorChains =
      buildDispositorChains({

        planets:
          planetaryPositions.planets
      });

    /*
      Functional roles
    */

    const functionalRoles =
      buildFunctionalRoles(
        houseLords
      );

    /*
      Dignities
    */

    const planetDignities =
      buildPlanetDignities(
        planetaryPositions.planets
      );

    /*
      Vedic drishti
    */

    const vedicDrishti =
      buildVedicDrishti(
        placements
      );

    /*
      Reinforcement graph
    */

    const reinforcementGraph =
      buildReinforcementGraph({

        dominantPatterns,

        dispositorChains,

        functionalRoles,

        placements
      });

    /*
      Axis activations
    */

    const axisActivations =
      buildAxisActivations(

        placements,

        houseClusters
      );

    /*
      Planetary state
    */

    const planetaryState =
      buildPlanetaryState({

        planets:
          planetaryPositions.planets,

        placements,

        dignities:
          planetDignities,

        functionalRoles,

        reinforcementGraph,

        axisActivations,

        dispositorChains
      });

    /*
      Support/tension
    */

    const supportTensionGraph =
      buildSupportTensionGraph(
        planetaryAspects
      );

    /*
      Moon
    */

    const moon =
      planetaryPositions.planets.find(

        (p) =>
          p.planet === "Moon"
      );

    if (!moon) {

      throw new Error(
        "Moon not found"
      );
    }

    /*
      Birth date

      Handles decimal hour:
      10.5 => 10:30
    */

    const birthHour =
      Math.floor(hour);

    const birthMinute =
      Math.round(
        (hour % 1) * 60
      );

    const birthDate =
      new Date(

        Date.UTC(

          year,

          month - 1,

          day,

          birthHour,

          birthMinute
        )
      );

    if (
      Number.isNaN(
        birthDate.getTime()
      )
    ) {

      throw new Error(
        "Invalid birth date"
      );
    }

    /*
      Vimshottari
    */

    const vimshottariDasha =
      calculateVimshottariDasha({

        moonLongitude:
          moon.longitude,

        moonNakshatra:
          moon.nakshatra,

        birthDate
      });

      const mahadashaTimeline =
  buildMahadashaTimeline({

    birthMahadashaPlanet:
      vimshottariDasha
        .currentMahadasha
        .planet,

    birthDate,

    balanceAtBirthYears:
      vimshottariDasha
        .currentMahadasha
        .balanceAtBirthYears
  });

  const currentMahadasha =
  mahadashaTimeline.find(
    period => period.isCurrent
  );

const antardashaTimeline =
  currentMahadasha
    ? buildAntardashaTimeline({
        mahadashaPlanet:
          currentMahadasha.planet,

        mahadashaStartDate:
          new Date(
            currentMahadasha.startDate
          ),

        mahadashaEndDate:
          new Date(
            currentMahadasha.endDate
          )
      })
    : [];

    const transitPositions =
  await calculateTransitPositions();

const transitActivations =
  buildTransitActivations({

    transitPlanets:
      transitPositions.planets,

    natalPlanets:
      planetaryPositions.planets
  });

 const currentAntardasha =
  antardashaTimeline.find(
    d => d.isCurrent
  );

const activationPriority =
  buildActivationPriority({

   
    transitActivations,

    reinforcementGraph,

    planetaryState
  });

  


  const natalKernel = {

  ascendant,

  ascendantLord:
    houseLords?.find(
      (h: any) => h.house === 1
    )?.lord,

    

  houses,

  placements,

  conjunctions,

  houseClusters,

  signClusters,

  houseActivations,

  planetaryAspects,

  planetaryConditionTags,

  dominantPatterns,

  dispositorChains,

  reinforcementGraph,

  axisActivations,

  supportTensionGraph,

  planetaryState,

  activationPriority,

  transitPositions,

  transitActivations,

  mahadashaTimeline,

  antardashaTimeline,

  planetDignities,

  functionalRoles,

  vedicDrishti,

  signLords,

  houseLords
};

/*
  Yoga / Dosha Analysis
*/

const yogaDoshaAnalysis =
  evaluateYogaDoshaEngine(
    natalKernel
  );

/*
  Enriched Natal Kernel
*/

const enrichedKernel = {

  ...natalKernel,

  detectedYogas:
    yogaDoshaAnalysis.yogas,

  detectedDoshas:
    yogaDoshaAnalysis.doshas,

  yogaDoshaAnalysis
};

const symbolicEvaluation =
  symbolicEvaluator(
    enrichedKernel
  );

const fullyEnrichedKernel = {

  ...enrichedKernel,

  symbolicEvaluation
};
/*
  Reading Orchestration
*/

console.log(
  "YOGA_DOSHA_DEBUG",
  {
    yogas:
      enrichedKernel.detectedYogas,

    doshas:
      enrichedKernel.detectedDoshas
  }
);

console.log(
  "SYMBOLIC_EVALUATION",
  JSON.stringify(
    symbolicEvaluation,
    null,
    2
  )
);

const orchestratedReading =
  await buildFullReadingOrchestrator(
    fullyEnrichedKernel
  );

  


    /*
      Response
    */

    return res.json({

      success: true,

      data:

        symbolicEvaluation,

        orchestratedReading
    });

  } catch (error: any) {

    console.error(
      "HOUSE_TEST_ERROR",
      error
    );

    return res.status(500).json({

      success: false,

      error:
        error?.message ||
        "Internal server error"
    });
  }
}