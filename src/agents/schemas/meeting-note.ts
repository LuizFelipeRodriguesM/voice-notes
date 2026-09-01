import { z } from "zod"

export const meetingNotesSchema = z.object({
  title: z.string().min(1).max(80),
  attendees: z.array(z.string().min(1)),
  summary: z.string().min(1).max(400),
  topics: z.array(
    z.object({
      title: z.string().min(1),
      points: z.array(z.string().min(1)),
    }),
  ),
  decisions: z.array(z.string().min(1)),
  technicalDecisions: z.array(z.string().min(1)),
  actionItems: z.array(
    z.object({
      task: z.string().min(1),
      owner: z.string().nullable(),
      due: z.string().nullable(),
      isMine: z.boolean(),
    }),
  ),
  disagreements: z.array(z.string().min(1)),
  followUp: z.string().nullable(),
  references: z.array(z.string().min(1)),
});

export type MeetingNotes = z.infer<typeof meetingNotesSchema>;

export const completionSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })).min(1),
});