import { profilePageApi } from "@/lib/api/profile-page/server-app";

export const GET = (req: Request) => profilePageApi.fetch(req);
