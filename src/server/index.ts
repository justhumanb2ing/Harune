import { appApi } from "@/lib/api/app/server-app";
import { profileApi } from "@/lib/api/profile/server-app";
import { rootApi } from "@/lib/api/root/server-app";
import { toServerApiRequest } from "./adapter";
import { createServerApi } from "./create-server-api";

export const serverApi = createServerApi({
  appApi,
  profileApi,
  rootApi,
});

export type ServerApi = typeof serverApi;

export const handleServerApiRequest = (req: Request) => serverApi.fetch(toServerApiRequest(req));
