import {
  PlanetaryAspect
} from "./detectPlanetaryAspects";

export interface SupportTensionNode {

  planet: string;

  supports: string[];

  tensions: string[];

  neutralConnections: string[];
}

const SUPPORT_ASPECTS = [
  "Conjunction",
  "Trine",
  "Sextile"
];

const TENSION_ASPECTS = [
  "Square",
  "Opposition"
];

export function buildSupportTensionGraph(

  aspects: PlanetaryAspect[]

): SupportTensionNode[] {

  const graph =
    new Map<
      string,
      SupportTensionNode
    >();

  function ensurePlanet(
    planet: string
  ) {

    if (
      !graph.has(
        planet
      )
    ) {

      graph.set(

        planet,

        {

          planet,

          supports: [],

          tensions: [],

          neutralConnections: []
        }
      );
    }

    return graph.get(
      planet
    )!;
  }

  for (
    const aspect
    of aspects
  ) {

    const p1 =
      ensurePlanet(
        aspect.planet1
      );

    const p2 =
      ensurePlanet(
        aspect.planet2
      );

    /*
      Supportive
    */

    if (
      SUPPORT_ASPECTS.includes(
        aspect.aspect
      )
    ) {

      p1.supports.push(
        aspect.planet2
      );

      p2.supports.push(
        aspect.planet1
      );

      continue;
    }

    /*
      Tension
    */

    if (
      TENSION_ASPECTS.includes(
        aspect.aspect
      )
    ) {

      p1.tensions.push(
        aspect.planet2
      );

      p2.tensions.push(
        aspect.planet1
      );

      continue;
    }

    /*
      Neutral
    */

    p1.neutralConnections.push(
      aspect.planet2
    );

    p2.neutralConnections.push(
      aspect.planet1
    );
  }

  /*
    Cleanup duplicates
  */

  return Array.from(
    graph.values()
  ).map(
    (node) => ({

      planet:
        node.planet,

      supports:
        Array.from(
          new Set(
            node.supports
          )
        ),

      tensions:
        Array.from(
          new Set(
            node.tensions
          )
        ),

      neutralConnections:
        Array.from(
          new Set(
            node.neutralConnections
          )
        )
    })
  );
}