import { handleAppApiRequest } from "@/lib/api/app/server-app";

export const POST = (req: Request) => handleAppApiRequest(req);
