import { createApiError } from "@/lib/api/error";

type OrvalResponseBody = string | undefined;

const getRequestUrl = (url: string) => url;

const getResponseBody = async (response: Response): Promise<OrvalResponseBody> => {
  if (response.status === 204) {
    return undefined;
  }

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return JSON.stringify(await response.json());
  }

  return await response.text();
};

export const orvalMutator = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(getRequestUrl(url), {
    ...init,
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.text();
    throw createApiError(body, response.status);
  }

  const body = await getResponseBody(response);

  if (body === undefined) {
    return {
      data: undefined,
      headers: response.headers,
      status: response.status,
    } as T;
  }

  try {
    return {
      data: JSON.parse(body),
      headers: response.headers,
      status: response.status,
    } as T;
  } catch {
    return {
      data: body,
      headers: response.headers,
      status: response.status,
    } as T;
  }
};
