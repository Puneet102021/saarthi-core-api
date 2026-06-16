export async function buildThemesKernel(
  themes: any
) {

  return {

    career:
      themes.career || [],

    relationships:
      themes.relationships || [],

    finance:
      themes.finance || [],

    health:
      themes.health || [],

    spirituality:
      themes.spirituality || []
  };
}