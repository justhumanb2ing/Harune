import { handleRootApiRequest } from "@/lib/api/root/server-app";

export const GET = (req: Request) => handleRootApiRequest(req);
