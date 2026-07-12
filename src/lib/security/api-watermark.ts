export function addSecurityWatermark(response: Response): Response {
  response.headers.set("X-App-Name", "Dahab Misr");
  response.headers.set("X-Content-Type", "application/json");
  response.headers.set(
    "Cache-Control",
    "no-store, no-cache, must-revalidate"
  );
  response.headers.set("Pragma", "no-cache");
  return response;
}
