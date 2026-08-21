export const healthCheck = (req: Bun.BunRequest<"/health">) => {
  console.log(`[${new Date().toISOString()}] ${req.method} /health`);

  return Response.json({ status: "ok" });
};
