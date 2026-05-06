import { toServerApiRequest } from "@/lib/api/server/adapter";
import { createServerApi } from "@/lib/api/server/create-server-api";
import { appApi } from "@/lib/api/services/app-server";
import { authApi } from "@/lib/api/services/auth-server";
import { profileApi } from "@/lib/api/services/profile-server";
import { rootApi } from "@/lib/api/services/root-server";

export const serverApi = createServerApi({
  appApi,
  authApi,
  profileApi,
  rootApi,
});

export type ServerApi = typeof serverApi;
export type HonoApp = ServerApi;

const fetchServerApi = serverApi.fetch.bind(serverApi);

serverApi.fetch = ((req, ...rest) =>
  fetchServerApi(toServerApiRequest(req), ...rest)) as typeof serverApi.fetch;

export default serverApi;
