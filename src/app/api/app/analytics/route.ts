import { handleAppApiRequest } from "@/lib/api/app/server-app";

export const GET = (req: Request) => handleAppApiRequest(req);
