import { profilePageApi } from "@/lib/api/profile-page/server-app";

export const dynamic = "force-dynamic";

export const GET = (req: Request) => profilePageApi.fetch(req);

export const PATCH = (req: Request) => profilePageApi.fetch(req);
