import { env } from "@env";
import { healthCheck } from "./routes/health-check.ts";
import { receiveAudio } from './routes/audio.ts';

const server = Bun.serve({
  port: env.PORT,
  routes: {
    // health check
    "/health": { GET: healthCheck },
    // receive audio
    "/audio": { POST: receiveAudio },
  }
});

console.log(`Server running at ${server.url}`);
