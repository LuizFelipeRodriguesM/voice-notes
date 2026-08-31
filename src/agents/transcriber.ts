import { env } from "@env"
import { z } from "zod"

const TRANSCRIPTIONS_URL = "https://api.openai.com/v1/audio/transcriptions";

const SYSTEM_PROMPT =
  "Nota de voz de um desenvolvedor de software relatando bugs e tarefas do projeto."

const transcriptionSchema = z.object({
  text: z.string().min(1),
});

export async function transcribeAudio(audio: Blob, filename: string): Promise<string> {

  const formData = new FormData();

  formData.set("file", audio, filename);
  formData.set("model", "gpt-transcribe");
  formData.set("language", "pt");
  formData.set("prompt", SYSTEM_PROMPT);
  // formData.set("prompt", GLOSSARY);

  const response = await fetch(TRANSCRIPTIONS_URL, {
    method: "POST",
    headers: { Authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: formData,
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Transcription failed (${response.status}): ${details}`);
  }

  const parsed = transcriptionSchema.safeParse(await response.json());

  if (!parsed.success) {
    throw new Error(`Unexpected response: ${z.prettifyError(parsed.error)}`);
  }

  return parsed.data.text;
}