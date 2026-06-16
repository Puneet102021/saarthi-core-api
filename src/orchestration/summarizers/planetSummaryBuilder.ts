export function buildPlanetSummary(
  item: any
) {

  const state =
    item.state;

  return {

    planet:
      item.planet,

    placement: {

      sign:
        state?.placement?.sign,

      house:
        state?.placement?.house
    },

    themes: [

      ...(state?.roles || []),

      ...(state?.symbolicFlags || [])
    ],

    reinforcementLevel:

      state?.reinforcements
        ?.length || 0
  };
}