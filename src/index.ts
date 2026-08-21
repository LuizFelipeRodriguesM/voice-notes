import { healthCheck } from "./routes/health-check.ts";

const server = Bun.serve({
  port: 3333,
  routes: {
    // health check
    "/health": healthCheck,
  }
});

console.log(`Server running at ${server.url}`);