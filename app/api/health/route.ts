export async function GET() {
  return Response.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    service: "concordia",
    version: "1.0.0",
  });
}
