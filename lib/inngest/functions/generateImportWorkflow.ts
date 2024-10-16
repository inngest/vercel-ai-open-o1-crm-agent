import { generateText } from "ai";
import { inngest } from "../client";
import { openai } from "@ai-sdk/openai";
import { Workflow } from "@inngest/workflow-kit";
import { actions } from "./importContacts";

type GeneratedStepModelCall = {
  model_name: string;
  batch_size: number;
  prompt: string;
};
type GeneratedStepAction = {
  action: string;
};
type GeneratedSteps = (GeneratedStepModelCall | GeneratedStepAction)[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isStepAction = (step: any): step is GeneratedStepAction => !!step.action;

const prompt = (contactsFileContent: string) => `
Considering the following available actions:
${actions
  .filter(({ kind }) => kind !== "openaiCall")
  .map(({ kind, description }) => `- ${description}, name: ${kind}\n`)}

and, given the below CSV file (between \`\`\`), recommend the best steps by balancing existing actions and using custom openai calls (do not use deprecated models) to successfully:
    - parse the contact information and remove any typos
    - enrich the contacts data
    - label them a decider and rank them as a good Sales target to sale software to based on the provided property
    - rework the CSV file to match the provided column to the following: Name, Position, Company, Email and the ranking and decider columns
    - save the contacts to the database

Return a JSON array made of steps to execute. When a step is a model call, provide the "model" for model name and "prompt" for the prompt with "{data}" as a placeholder for the provided data; When the step is an action, provide the action name.
The data return from model calls should be JSON only.

\`\`\`
${contactsFileContent}
\`\`\`
`;

export default inngest.createFunction(
  {
    id: "generate-import-workflow",
    // cf, Tier 3 limits: https://x.com/OpenAIDevs/status/1841176573527077235
    throttle: {
      limit: 5000,
      period: "1m",
    },
  },
  { event: "contacts.uploaded" },
  async ({ event, step }) => {
    const generatedStepsResult = await step.run(
      "openai-o1-generate-steps",
      async () => {
        return await generateText({
          // for prod:
          model: openai("o1-preview-2024-09-12"),
          // for dev:
          // model: openai("o1-mini"),
          messages: [
            { role: "user", content: prompt(event.data.contactsFileContent) },
          ],
        });
      }
    );

    const workflowInstance = await step.run(
      "format-steps-to-workflow-instance",
      async () => {
        const steps = JSON.parse(
          ((await generatedStepsResult.text) as string)
            .replace("```json", "")
            .replace("```", "")
        ) as GeneratedSteps;

        const wfInstance: Workflow = {
          name: "Import contacts",
          edges: [
            {
              to: "1",
              from: "$source",
            },
          ],
          actions: [],
        };

        steps.forEach((step, idx) => {
          const index = idx + 1;

          if (index > 1) {
            wfInstance.edges.push({
              from: (index - 1).toString(),
              to: index.toString(),
            });
          }

          if (isStepAction(step)) {
            wfInstance.actions.push({
              id: index.toString(),
              name: step.action,
              kind: step.action,
            });
          } else {
            wfInstance.actions.push({
              id: index.toString(),
              name: "openaiCall",
              kind: "openaiCall",
              inputs: {
                ...step,
              },
            });
          }
        });

        return wfInstance;
      }
    );

    await step.sendEvent("invoke-workflow", {
      name: "contact.process",
      data: {
        workflowInstance,
        contactsFileContent: event.data.contactsFileContent,
      },
    });
  }
);
