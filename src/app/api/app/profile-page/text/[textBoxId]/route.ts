import { handleProfilePageApiRequest } from "@/lib/api/profile-page/server-app";

export const PATCH = (req: Request) => handleProfilePageApiRequest(req);

export const DELETE = (req: Request) => handleProfilePageApiRequest(req);
