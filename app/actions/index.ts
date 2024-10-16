"use server";

import { inngest } from "@/lib/inngest/client";

export async function uploadFile(formData: FormData) {
  const file = formData.get("file") as File;
  const contactsFileContent = await file.text();

  await inngest.send({
    name: "contacts.uploaded",
    data: {
      contactsFileContent,
    },
  });
}
