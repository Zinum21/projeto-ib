/** Compare against the actual Host header: Next can normalize 127.0.0.1 to localhost. */
export function sameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (!origin || !host) return false;
  try {
    const parsed = new URL(origin);
    const protocol = new URL(request.url).protocol;
    return parsed.host.toLowerCase() === host.toLowerCase() && parsed.protocol === protocol;
  } catch {
    return false;
  }
}
