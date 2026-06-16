import {
  buildTechnicalOverviewContext
} from "./contextBuilders/technicalOverviewContext";

import {
  buildPersonalityContext
} from "./contextBuilders/personalityContext";

import {
  buildEmotionalContext
} from "./contextBuilders/emotionalContext";

import {
  buildBehavioralContext
} from "./contextBuilders/behavioralContext";

import {
  buildRelationshipContext
} from "./contextBuilders/relationshipContext";

import {
  buildCareerContext
} from "./contextBuilders/careerContext";

import {
  buildFinancialContext
} from "./contextBuilders/financialContext";

import {
  buildHealthContext
} from "./contextBuilders/healthContext";

import {
  buildKarmicContext
} from "./contextBuilders/karmicContext";

import {
  buildRemedyContext
} from "./contextBuilders/remedyContext";

import {
  buildTimelineContext
} from "./contextBuilders/timelineContext";

import {
  buildSynthesisContext
} from "./contextBuilders/synthesisContext";

import {
  generateSectionNarrative
} from "./generateSectionNarrative";

import {
  buildStructuralContext
} from "./structuralOrchestration/buildStructuralContext";

export async function buildFullReadingOrchestrator(
  kernel: any
) {

  /*
    STRUCTURAL ORCHESTRATION

    IMPORTANT:
    This layer does NOT interpret astrology.

    It only:
    - prioritizes
    - groups
    - structures
    - highlights convergence
    - improves LLM attention routing
  */

  const structuralContext =
    buildStructuralContext(kernel);

  /*
    SHARED ORCHESTRATION PAYLOAD
  */

  const orchestrationPayload = {

    kernel,

    structuralContext
  };

  /*
    SECTION CONTEXTS
  */

  const sectionContexts = [

    buildTechnicalOverviewContext(
      orchestrationPayload
    ),

    buildPersonalityContext(
      orchestrationPayload
    ),

    buildEmotionalContext(
      orchestrationPayload
    ),

    buildBehavioralContext(
      orchestrationPayload
    ),

    buildRelationshipContext(
      orchestrationPayload
    ),

    buildCareerContext(
      orchestrationPayload
    ),

    buildFinancialContext(
      orchestrationPayload
    ),

    buildHealthContext(
      orchestrationPayload
    ),

    buildKarmicContext(
      orchestrationPayload
    ),

    buildRemedyContext(
      orchestrationPayload
    ),

    buildTimelineContext(
      orchestrationPayload
    ),

    buildSynthesisContext(
      orchestrationPayload
    )
  ];

  /*
    NARRATIVE GENERATION
  */

  const generatedSections = [];

  for (
    const section
    of sectionContexts
  ) {

    const generated =
      await generateSectionNarrative({

        section
      });

    generatedSections.push(
      generated
    );
  }

  /*
    FINAL RESPONSE
  */

  return {

    generatedAt:
      new Date().toISOString(),

    chartIdentity: {

      ascendant:
        kernel.ascendant,

      currentMahadasha:
        kernel.mahadashaTimeline?.find(
          (d: any) => d.isCurrent
        ),

      currentAntardasha:
        kernel.antardashaTimeline?.find(
          (d: any) => d.isCurrent
        )
    },

    structuralContext,

    sections:
      generatedSections
  };
}