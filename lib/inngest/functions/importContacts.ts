import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { NonRetriableError } from "inngest";
import { Type } from "@sinclair/typebox";
import csv from "csvtojson";

import { Engine, EngineAction } from "@inngest/workflow-kit";
import { inngest } from "../client";

const formatGeneratedPromptDataPlaceholder = (str: string, data: string) =>
  str.replace(/\{[a-zA-Z\_]+\}/gi, data);

export const actions: EngineAction[] = [
  {
    kind: "openaiCall",
    name: "Make a dynamic call to OpenAI API",
    handler: async ({ event, step, workflowAction, state }) => {
      console.log("openaiCall!!!");
      const result = await step.run("make-openai-call", async () => {
        if (!workflowAction.inputs?.prompt) {
          throw new NonRetriableError("`openaiCall` called without a prompt.");
        }

        const data = state.get("contacts") || event.data.contactsFileContent;

        console.log(
          "PROMPT",
          formatGeneratedPromptDataPlaceholder(
            workflowAction.inputs.prompt,
            data
          )
        );

        return await generateText({
          model: openai(workflowAction.inputs?.model || "gpt-3.5-turbo"),
          prompt: formatGeneratedPromptDataPlaceholder(
            workflowAction.inputs.prompt,
            data
          ),
        });
      });
      state.set("contacts", result.text);
    },
    inputs: {
      prompt: {
        type: Type.String(),
        fieldType: "text",
      },
      model: {
        type: Type.String(),
        fieldType: "text",
      },
    },
  },
  {
    kind: "convert",
    name: "Convert to JSON",
    description: "convert CSV data to JSON items",
    handler: async ({ step, event, state }) => {
      console.log("CONVERT");
      const json = await step.run("convert-csv-to-json", async () => {
        return await csv().fromString(event.data.contactsFileContent);
      });
      state.set("contacts", JSON.stringify(json));
    },
  },
  {
    kind: "enrich",
    name: "Enrich contact data",
    description: "enrich contact information",
    handler: async ({}) => {
      console.log("ENRICH");
      // For example, call Clearbit or other enrichment API
    },
  },
  {
    kind: "save",
    name: "Save contacts",
    description: "save contact information to the database",
    handler: async ({ state }) => {
      console.log("SAVE");
      console.log(state.get("contacts"));
    },
  },
];

const workflowEngine = new Engine({
  actions,
  loader: (event) => {
    return event.data.workflowInstance;
  },
});

export default inngest.createFunction(
  { id: "import-contacts" },
  { event: "contact.process" },
  async ({ event, step }) => {
    // When `run` is called, the loader function is called with access to the event
    await workflowEngine.run({ event, step });
  }
);
