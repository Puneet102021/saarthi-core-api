export function buildLifeThemesContext(
  kernel: any
) {

  const symbolicEvaluation =
    kernel.symbolicEvaluation || {};

  return {

    section:
      "LIFE_THEMES",

    purpose:
      "Identify recurring life patterns supported by multiple symbolic signals.",

    lifeThemeSignals: {

  recurringThemes:
    symbolicEvaluation.recurringThemes || [],

  periodDrivers:
    symbolicEvaluation.periodDrivers || {}
},
    llmInstruction: {

      style:
        "Life story synthesis",

      mustDo: [

        "Identify 3 to 5 recurring life themes.",

        "Focus on repeated patterns.",

        "Explain why each theme matters.",

        "Explain how each theme can become a strength.",

        "Explain how each theme can become a challenge.",

        "Discuss how current timing may amplify the themes.",

        "Write in practical human language."
      ],

      mustAvoid: [

        "Do not explain planets.",

        "Do not explain houses.",

        "Do not explain signs.",

        "Do not teach astrology.",

        "Do not provide predictions.",

        "Do not provide remedies.",

        "Do not repeat technical observations.",

        "Do not use bullet-heavy report style."
      ]
    }
  };
}