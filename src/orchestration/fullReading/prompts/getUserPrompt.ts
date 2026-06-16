export function getUserPrompt(
  sectionType: string,
  section: any
) {

  switch (sectionType) {

    case "TECHNICAL_CHART_OVERVIEW":

      return `
SECTION CONTEXT

${JSON.stringify(section,null,2)}

Describe what immediately stands out.

Remain in observation mode.
`;

    case "CORE_INFLUENCES":

return `
SECTION CONTEXT

${JSON.stringify(section, null, 2)}

The technical overview has already been completed.

IMPORTANT

Start from:

symbolicEvaluation.evidenceChains

These represent recurring patterns supported
by multiple chart structures.

Do not start from planets.

Do not start from signs.

Do not start from houses.

Do not start from yogas.

Review the evidence chains.

Identify the strongest recurring patterns.

For each pattern explain:

where opportunities emerge
where strengths emerge
where challenges emerge
where blind spots may emerge

Use practical life language.

Use:

majorStructures
chartSignature
dominantYogas
dominantDoshas

Explain why the recurring patterns
receive reinforcement.

Do not explain astrology mechanics.

Review:

currentMahadasha
currentAntardasha

Do not explain the dasha planets.

Instead explain:

which recurring patterns are currently amplified
which strengths receive support
which challenges may become more noticeable

Treat dashas as amplifiers of existing themes.

Summarize:

strongest recurring strengths
strongest recurring challenges
strongest recurring opportunities

IMPORTANT

Every meaningful statement must be traceable
to evidence in the supplied context.

If a statement cannot be supported by:

evidenceChains
majorStructures
chartSignature
periodDrivers

do not make the statement.

Do not teach astrology.

Do not explain astrology.

Do not predict events.

Do not provide remedies.

Generate the CORE_INFLUENCES section now.
`;

case "CAREER":

  return `
SECTION CONTEXT

${JSON.stringify(section, null, 2)}

Explain the strongest recurring career patterns.

Start from:

- symbolicEvaluation
- selectedCareerSignals
- careerStructures
- timingFactors

Identify:

- work strengths
- growth patterns
- recurring challenges
- leadership tendencies
- professional development themes

Use practical language.

Avoid astrology jargon.

Do not predict specific jobs.

Do not predict specific events.

Do not promise success.

Generate the CAREER section now.
`;
case "LIFE_THEMES":

  return `
SECTION CONTEXT

${JSON.stringify(section, null, 2)}

The technical overview and core influences have already been discussed.

The symbolic engine has identified recurring structural patterns.

These patterns are observations.

They are not interpretations.

Your task is to determine what these recurring patterns may represent in life.

STEP 1

Review:

- recurringThemes
- periodDrivers

STEP 2

For each recurring pattern:

- identify what may be repeating
- identify where it may appear in life
- explain why it may become important
- explain how it may create opportunities
- explain how it may create challenges

Use the supplied evidence.

Do not explain astrology.

Do not discuss planets.

Do not discuss signs.

Do not discuss houses.

Do not discuss yogas.

Do not discuss doshas.

Do not use textbook astrology meanings.

STEP 3

Look for connections between patterns.

Do not treat each pattern independently.

Determine whether several patterns appear to point toward a larger recurring story.

STEP 4

Discuss how current timing may increase visibility of existing patterns.

Do not predict events.

Do not discuss future timelines.

Do not discuss dates.

Do not discuss specific outcomes.

STEP 5

Finish with a synthesis.

Answer:

"What recurring story appears to run through this chart?"

Write naturally.

Write as if speaking directly to the person.

Avoid report language.

Avoid bullet points.

Avoid generic self-help advice.

Generate the LIFE_THEMES section now.
`;
  }
}