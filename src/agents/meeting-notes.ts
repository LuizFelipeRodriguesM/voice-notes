import { env } from "@env";
import { z } from "zod";
import { meetingNotePrompt } from './prompts/meeting-note';
import { meetingNotesSchema, completionSchema  } from './schemas/meeting-note';

const COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

export type MeetingNotes = z.infer<typeof meetingNotesSchema>;

export async function extractMeetingNotes(transcript: string): Promise<MeetingNotes> {
  const response = await fetch(COMPLETIONS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-5.6-terra",
      messages: [
        { role: "system", content: meetingNotePrompt },
        { role: "user", content: transcript },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "meeting_notes",
          strict: true,
          schema: z.toJSONSchema(meetingNotesSchema),
        },
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Meeting notes failed (${response.status}): ${await response.text()}`);
  }

  const completion = completionSchema.parse(await response.json());
  const parsed = meetingNotesSchema.safeParse(JSON.parse(completion.choices[0]!.message.content));

  if (!parsed.success) {
    throw new Error(`Invalid meeting notes: ${z.prettifyError(parsed.error)}`);
  }

  return parsed.data;
}