import { ApiError } from "@/lib/react-query/fetcher";

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

const getErrorMessage = (body: string) => {
  try {
    const parsed = JSON.parse(body) as {
      error?: string;
      message?: string;
    };

    return parsed.error || parsed.message || body;
  } catch {
    return body;
  }
};

export const orvalMutator = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(getRequestUrl(url), {
    ...init,
    credentials: "include",
  });

  if (!response.ok) {
    const body = await response.text();
    const error = new ApiError(getErrorMessage(body) || "Request Failed");
    error.status = response.status;
    error.body = body;
    throw error;
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
