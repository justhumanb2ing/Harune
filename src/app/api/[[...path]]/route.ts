import { handleServerApiRequest } from "@/server";

export const dynamic = "force-dynamic";

export const DELETE = (req: Request) => handleServerApiRequest(req);

export const GET = (req: Request) => handleServerApiRequest(req);

export const PATCH = (req: Request) => handleServerApiRequest(req);

export const POST = (req: Request) => handleServerApiRequest(req);
