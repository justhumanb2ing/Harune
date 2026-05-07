import { handle } from "hono/vercel";
import routes from "@/lib/api/server";

export const dynamic = "force-dynamic";

export const GET = handle(routes);
