import { isAuthorized, unauthorized } from "../lib/auth.ts";

const MAX_AUDIO_BYTES = 25 * 1024 * 1024;

const AUDIO_DIR = "audios";

const EXTENSION_BY_MIME: Record<string, string> = {
  "audio/m4a": "m4a",
  "audio/x-m4a": "m4a",
  "audio/mp4": "m4a",
  "audio/mpeg": "mp3",
  "audio/wav": "wav",
};

export const receiveAudio = async (req: Bun.BunRequest<"/audio">) => {
  const timestamp = new Date().toISOString();

  if (!isAuthorized(req)) {
    console.log(`[${timestamp}] POST /audio 401`);
    return unauthorized();
  }

  const contentType = req.headers.get("content-type") ?? "unknown";
  const audio = await req.blob();

  if (audio.size === 0) {
    console.log(`[${timestamp}] POST /audio 400 corpo vazio type=${contentType}`);
    return Response.json({ error: "Empty body" }, { status: 400 });
  }

  if (audio.size > MAX_AUDIO_BYTES) {
    console.log(`[${timestamp}] POST /audio 413 size=${audio.size}`);
    return Response.json({ error: "Audio too large" }, { status: 413 });
  }

  const sizeKb = (audio.size / 1024).toFixed(1);

  console.log(`[${timestamp}] POST /audio 202 type=${contentType} size=${sizeKb}KB`);

  const mimeType = contentType.split(";")[0]?.trim() ?? "";
  const extension = EXTENSION_BY_MIME[mimeType] ?? "bin";
  const filename = `${timestamp.replace(/[:.]/g, "-")}.${extension}`;
  const path = `${AUDIO_DIR}/${filename}`;

  await Bun.write(path, audio);

  return Response.json({ status: "accepted" }, { status: 202 });
};