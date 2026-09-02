import { StateGraph, START, END } from "@langchain/langgraph";
import { z } from "zod";
import { transcribeAudio } from "./agents/transcriber.ts";
import { extractMeetingNotes } from "./agents/meeting-notes.ts";
import { saveMeetingNotes } from "./lib/notion.ts";
import { meetingNotesSchema } from "./agents/schemas/meeting-note.ts";

const VoiceNoteState = z.object({
  audio: z.instanceof(Blob),
  filename: z.string(),
  transcript: z.string().default(""),
  notes: meetingNotesSchema.nullable().default(null),
  notionUrl: z.string().default(""),
});

export const voiceNoteGraph = new StateGraph(VoiceNoteState)
  .addNode("transcribe", async (state) => ({
    transcript: await transcribeAudio(state.audio, state.filename),
  }))
  .addNode("extractNotes", async (state) => ({
    notes: await extractMeetingNotes(state.transcript),
  }))
  .addNode("saveToNotion", async (state) => ({
    notionUrl: await saveMeetingNotes(state.notes!),
  }))
  .addEdge(START, "transcribe")
  .addEdge("transcribe", "extractNotes")
  .addEdge("extractNotes", "saveToNotion")
  .addEdge("saveToNotion", END)
  .compile();
