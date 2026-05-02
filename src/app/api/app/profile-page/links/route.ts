import { handleProfilePageApiRequest } from "@/lib/api/profile-page/server-app";

export const POST = (req: Request) => handleProfilePageApiRequest(req);
