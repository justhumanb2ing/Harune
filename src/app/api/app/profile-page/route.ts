import { handleProfilePageApiRequest } from "@/lib/api/profile-page/server-app";

export const dynamic = "force-dynamic";

export const GET = (req: Request) => handleProfilePageApiRequest(req);

export const PATCH = (req: Request) => handleProfilePageApiRequest(req);
