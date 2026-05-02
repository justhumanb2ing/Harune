import { handleProfilePageApiRequest } from "@/lib/api/profile-page/server-app";

export const GET = (req: Request) => handleProfilePageApiRequest(req);
