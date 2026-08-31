import { transcribeAudio } from "../agents/transcriber.ts";

const path = process.argv[2];

if (!path) {
  console.error("uso: bun run src/scripts/transcribe-file.ts <caminho>");
  process.exit(1);
}

const audio = await Bun.file(path);
const filename = path.split("/").pop() ?? "audio.m4a";

console.log(await transcribeAudio(audio, filename));