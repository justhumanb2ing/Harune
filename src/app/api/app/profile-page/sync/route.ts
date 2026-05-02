import { handleProfilePageApiRequest } from "@/lib/api/profile-page/server-app";

export const dynamic = "force-dynamic";

export const POST = (req: Request) => handleProfilePageApiRequest(req);
