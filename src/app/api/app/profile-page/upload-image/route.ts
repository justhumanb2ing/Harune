import { profilePageApi } from "@/lib/api/profile-page/server-app";

export const POST = (req: Request) => profilePageApi.fetch(req);

export const PATCH = (req: Request) => profilePageApi.fetch(req);

export const DELETE = (req: Request) => profilePageApi.fetch(req);
