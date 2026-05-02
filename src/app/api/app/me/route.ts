import { handleAppApiRequest } from "@/lib/api/app/server-app";

export const dynamic = "force-dynamic";

export const GET = (req: Request) => handleAppApiRequest(req);

export const PATCH = (req: Request) => handleAppApiRequest(req);
