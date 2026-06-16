import {
openai
} from "../../lib/openai";

import {
getSystemPrompt
} from "./prompts/getSystemPrompt";

import {
getUserPrompt
} from "./prompts/getUserPrompt";

interface GenerateSectionNarrativeInput {

section: any;
}

export async function generateSectionNarrative({

section

}: GenerateSectionNarrativeInput) {

const mustDoText = (


section.llmInstruction?.mustDo || []


)
.map(
(item: string) =>
"- " + item
)
.join("\n");

const mustAvoidText = (


section.llmInstruction?.mustAvoid || []


)
.map(
(item: string) =>
"- " + item
)
.join("\n");

const sectionType =
section.section;

const systemPrompt =


getSystemPrompt(

  sectionType,

  section,

  mustDoText,

  mustAvoidText
);


const userPrompt =


getUserPrompt(

  sectionType,

  section
);


console.log(


"SECTION_CONTEXT",

JSON.stringify(

  section,

  null,

  2
)


);

const response =


await openai.chat.completions.create({

  model:
    "gpt-4o-mini",

  temperature:
    0.7,

  max_tokens:
    1200,

  messages: [

    {
      role:
        "system",

      content:
        systemPrompt
    },

    {
      role:
        "user",

      content:
        userPrompt
    }
  ]
});


const generatedNarrative =


response.choices?.[0]
  ?.message
  ?.content || "";


return {


section:
  section.section,

title:
  section.section
    ?.replaceAll(
      "_",
      " "
    ),

generatedNarrative,

rawContext:
  section,

prompts: {

  systemPrompt,

  userPrompt
}


};
}
