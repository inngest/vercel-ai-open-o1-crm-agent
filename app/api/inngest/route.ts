import { serve } from "inngest/next";
import { inngest } from "@/lib/inngest/client";
import generateImportWorkflow from "@/lib/inngest/functions/generateImportWorkflow";
import importContacts from "@/lib/inngest/functions/importContacts";

// required for streaming and Inngest's workflow SDK compat
export const runtime = "edge";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [generateImportWorkflow, importContacts],
  streaming: "allow", // enable streaming for longer step duration (openai-o1)
});
