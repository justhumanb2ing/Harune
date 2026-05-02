import { handleRootApiRequest } from "@/lib/api/root/server-app";

export const dynamic = "force-dynamic";

export const GET = (req: Request) => handleRootApiRequest(req);
