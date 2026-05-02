import { profilePageApi } from "@/lib/api/profile-page/server-app";

export const dynamic = "force-dynamic";

export const POST = (req: Request) => profilePageApi.fetch(req);
