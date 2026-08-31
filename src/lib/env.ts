import { z } from "zod";

const envSchema = z.object({
  AUDIO_WEBHOOK_SECRET: z.string().min(1),
  PORT: z.coerce.number().default(3333),
  OPENAI_API_KEY: z.string().min(1),
});

const parsed = envSchema.safeParse(Bun.env);

if (!parsed.success) {
  console.error("Invalid environment variables:");
  console.error(z.prettifyError(parsed.error));
  process.exit(1);
}

export const env = parsed.data;
