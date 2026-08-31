import { StateGraph, START, END } from "@langchain/langgraph";
import { z } from "zod";
import { transcribeAudio } from "./agents/transcriber.ts";

const VoiceNoteState = z.object({
  audio: z.instanceof(Blob),
  filename: z.string(),
  transcript: z.string().default(""),
});

export const voiceNoteGraph = new StateGraph(VoiceNoteState)
  .addNode("transcribe", async (state) => ({
    transcript: await transcribeAudio(state.audio, state.filename),
  }))
  .addEdge(START, "transcribe")
  .addEdge("transcribe", END)
  .compile();