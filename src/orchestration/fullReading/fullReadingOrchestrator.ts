import {
  buildTechnicalOverviewContext
} from "./contextBuilders/technicalOverviewContext";

import {
  buildCoreInfluencesContext
} from "./contextBuilders/coreInfluencesContext";

import {
  generateSectionNarrative
} from "./generateSectionNarrative";

import {
  buildCareerContext
} from "./contextBuilders/careerContext";

import {
  buildLifeThemesContext
} from "./contextBuilders/lifeThemesContext";

export async function buildFullReadingOrchestrator(
  kernel: any
) {

  const sectionContexts = [

  buildTechnicalOverviewContext(
    kernel
  ),

  buildCoreInfluencesContext(
    kernel
  ),

  buildLifeThemesContext(
    kernel
  ),

  ];


  const sections =
    await Promise.all(

      sectionContexts.map(
        (section) =>

          generateSectionNarrative({

            section
          })
      )
    );

  return {

    generatedAt:
      new Date().toISOString(),

    sectionCount:
      sections.length,

    sections
  };
}