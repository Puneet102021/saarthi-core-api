import {
  buildSymbolicSummary
} from "../summarizers/symbolicSummaryBuilder";

import {
  buildPlanetSummary
} from "../summarizers/planetSummaryBuilder";

export function selectRelevantSymbols({

  domain,

  kernel

}: {

  domain: string;

  kernel: any;
}) {

  const currentMahadasha =
    kernel.mahadashaTimeline?.find(
      (d: any) => d.isCurrent
    );

  const currentAntardasha =
    kernel.antardashaTimeline?.find(
      (d: any) => d.isCurrent
    );

  switch (domain) {

    /*
      PERSONALITY
    */

    case "PERSONALITY":

      return {

        dominantPatterns:
          kernel.dominantPatterns,

        activationPriority:
          kernel.activationPriority?.map(
            buildSymbolicSummary
          ),

        keyPlanets:
          kernel.planetaryState
            ?.filter(
              (p: any) => [

                "Sun",
                "Moon",
                "Mercury"

              ].includes(
                p.planet
              )
            )
            ?.map(
              buildPlanetSummary
            ),

        conjunctions:
          kernel.conjunctions,

        planetaryAspects:
          kernel.planetaryAspects,

        axisActivations:
          kernel.axisActivations
      };

    /*
      EMOTIONAL
    */

    case "EMOTIONAL":

      return {

        dominantPatterns:
          kernel.dominantPatterns,

        activationPriority:
          kernel.activationPriority?.map(
            buildSymbolicSummary
          ),

        emotionalPlanets:
          kernel.planetaryState
            ?.filter(
              (p: any) => [

                "Moon",
                "Mercury",
                "Saturn",
                "Rahu"

              ].includes(
                p.planet
              )
            )
            ?.map(
              buildPlanetSummary
            ),

        conjunctions:
          kernel.conjunctions,

        planetaryAspects:
          kernel.planetaryAspects,

        transitActivations:
          kernel.transitActivations,

        currentMahadasha,

        currentAntardasha
      };

    /*
      CAREER
    */

    case "CAREER":

      return {

        dominantPatterns:
          kernel.dominantPatterns,

        activationPriority:
          kernel.activationPriority?.map(
            buildSymbolicSummary
          ),

        careerPlanets:
          kernel.planetaryState
            ?.filter(
              (p: any) => [

                "Saturn",
                "Mars",
                "Sun",
                "Mercury",
                "Jupiter"

              ].includes(
                p.planet
              )
            )
            ?.map(
              buildPlanetSummary
            ),

        conjunctions:
          kernel.conjunctions,

        planetaryAspects:
          kernel.planetaryAspects,

        transitActivations:
          kernel.transitActivations,

        currentMahadasha,

        currentAntardasha
      };

    /*
      RELATIONSHIP
    */

    case "RELATIONSHIP":

      return {

        dominantPatterns:
          kernel.dominantPatterns,

        activationPriority:
          kernel.activationPriority?.map(
            buildSymbolicSummary
          ),

        relationshipPlanets:
          kernel.planetaryState
            ?.filter(
              (p: any) => [

                "Venus",
                "Moon",
                "Mars",
                "Rahu",
                "Ketu"

              ].includes(
                p.planet
              )
            )
            ?.map(
              buildPlanetSummary
            ),

        conjunctions:
          kernel.conjunctions,

        planetaryAspects:
          kernel.planetaryAspects,

        transitActivations:
          kernel.transitActivations,

        currentMahadasha
      };

    /*
      FINANCIAL
    */

    case "FINANCIAL":

      return {

        dominantPatterns:
          kernel.dominantPatterns,

        activationPriority:
          kernel.activationPriority?.map(
            buildSymbolicSummary
          ),

        financialPlanets:
          kernel.planetaryState
            ?.filter(
              (p: any) => [

                "Jupiter",
                "Venus",
                "Saturn"

              ].includes(
                p.planet
              )
            )
            ?.map(
              buildPlanetSummary
            ),

        transitActivations:
          kernel.transitActivations
      };

    /*
      HEALTH
    */

    case "HEALTH":

      return {

        dominantPatterns:
          kernel.dominantPatterns,

        activationPriority:
          kernel.activationPriority?.map(
            buildSymbolicSummary
          ),

        healthPlanets:
          kernel.planetaryState
            ?.filter(
              (p: any) => [

                "Moon",
                "Sun",
                "Mars",
                "Saturn"

              ].includes(
                p.planet
              )
            )
            ?.map(
              buildPlanetSummary
            ),

        transitActivations:
          kernel.transitActivations
      };

    /*
      KARMA
    */

    case "KARMA":

      return {

        dominantPatterns:
          kernel.dominantPatterns,

        axisActivations:
          kernel.axisActivations,

        karmicPlanets:
          kernel.planetaryState
            ?.filter(
              (p: any) => [

                "Rahu",
                "Ketu",
                "Saturn",
                "Jupiter"

              ].includes(
                p.planet
              )
            )
            ?.map(
              buildPlanetSummary
            )
      };

    /*
      REMEDIES
    */

    case "REMEDIES":

      return {

        activationPriority:
          kernel.activationPriority?.map(
            buildSymbolicSummary
          ),

        transitActivations:
          kernel.transitActivations,

        currentMahadasha,

        currentAntardasha
      };

    /*
      TIMELINE
    */

    case "TIMELINE":

      return {

        currentMahadasha,

        currentAntardasha,

        transitActivations:
          kernel.transitActivations,

        activationPriority:
          kernel.activationPriority?.map(
            buildSymbolicSummary
          )
      };

    /*
      DEFAULT
    */

    default:

      return {

        dominantPatterns:
          kernel.dominantPatterns,

        activationPriority:
          kernel.activationPriority?.map(
            buildSymbolicSummary
          )
      };
  }
}
