type RouteMeasurement = {
  durationMs: number;
  location: string | null;
  method: "GET";
  ok: boolean;
  route: string;
  status: number | "error";
};

const ENTRY_BUDGET_MS = Number(process.env.ROUTE_ENTRY_BUDGET_MS ?? "1000");
const REQUEST_TIMEOUT_MS = Number(process.env.ROUTE_ENTRY_TIMEOUT_MS ?? "10000");
const baseUrl = process.env.ROUTE_ENTRY_BASE_URL ?? "http://localhost:3000";
const handle = process.env.ROUTE_ENTRY_HANDLE ?? "demo";
const cookie = process.env.ROUTE_ENTRY_COOKIE;

const routes = [
  "/",
  "/sign-in",
  "/sign-up",
  "/post-sign-in",
  "/create",
  `/${handle}/app`,
  `/${handle}/analytics`,
  `/${handle}`,
  "/api/app/me",
  "/api/app/profile-page",
] as const;

const measureRoute = async (route: string): Promise<RouteMeasurement> => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const startedAt = performance.now();

  try {
    const response = await fetch(new URL(route, baseUrl), {
      headers: cookie ? { cookie } : undefined,
      method: "GET",
      redirect: "manual",
      signal: controller.signal,
    });
    const durationMs = Math.round(performance.now() - startedAt);

    return {
      durationMs,
      location: response.headers.get("location"),
      method: "GET",
      ok: durationMs <= ENTRY_BUDGET_MS,
      route,
      status: response.status,
    };
  } catch {
    return {
      durationMs: Math.round(performance.now() - startedAt),
      location: null,
      method: "GET",
      ok: false,
      route,
      status: "error",
    };
  } finally {
    clearTimeout(timeout);
  }
};

const results = await Promise.all(routes.map(measureRoute));

console.table(
  results.map((result) => ({
    route: result.route,
    status: result.status,
    durationMs: result.durationMs,
    withinBudget: result.ok,
    location: result.location ?? "",
  }))
);

const failed = results.filter((result) => !result.ok);

if (failed.length > 0) {
  process.exitCode = 1;
}

export {};
