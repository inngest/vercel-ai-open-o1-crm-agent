import { sql } from "@vercel/postgres";
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
      const result = await step.ai.infer("make-openai-call", {
        model: step.ai.models.openai({
          model: workflowAction.inputs?.model || "gpt-4",
        }),
        body: {
          messages: [
            {
              role: "user",
              content: formatGeneratedPromptDataPlaceholder(
                workflowAction.inputs?.prompt || "",
                state.get("contacts") || event.data.contactsFileContent
              ),
            },
          ],
        },
      });

      state.set("contacts", result.choices[0].message.content || "{}");
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
      // For example, call Clearbit or other enrichment API
    },
  },
  {
    kind: "save",
    name: "Save contacts",
    description: "save contact information to the database",
    handler: async ({ state, step }) => {
      await step.run("save-contacts-to-database", async () => {
        const contacts = JSON.parse(state.get("contacts"));
        await sql.query(
          `INSERT INTO contacts (Name,Position,Company,Email,Decider,Ranking) VALUES ${contacts
            .map((contact: Record<string, string | number>) => {
              return `('${contact.Name}', '${contact.Position}', '${contact.Company}', '${contact.Email}', ${contact.Decider}, ${contact.Ranking})`;
            })
            .join()}`
        );
      });
    },
  },
];

interface ProcessEvent {
  data: {
    workflowInstance: any;
    contactsFileContent: string;
  };
}

const workflowEngine = new Engine({
  actions,
  loader: (event: ProcessEvent) => {
    return event.data.workflowInstance;
  },
});

export default inngest.createFunction(
  { id: "import-contacts" },
  { event: "contact.process" },
  async ({ event, step }) => {
    await workflowEngine.run({ event, step });
  }
);
