import { handle } from "hono/vercel";
import routes from "@/lib/api/server";

export const dynamic = "force-dynamic";

export const DELETE = handle(routes);

export const GET = handle(routes);

export const PATCH = handle(routes);

export const POST = handle(routes);
