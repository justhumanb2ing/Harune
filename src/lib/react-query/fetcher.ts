export type FetcherParams = string | [string, string];

export class ApiError extends Error {
  status?: number;
  body?: string;
}

const getRequestUrl = (params: FetcherParams) => {
  if (typeof params === "string") {
    return params;
  }

  const [url, queryString] = params;
  return queryString ? `${url}?${queryString}` : url;
};

const getErrorMessage = (body: string) => {
  try {
    const parsed = JSON.parse(body) as { error?: string; message?: string };
    return parsed.error || parsed.message || body;
  } catch {
    return body;
  }
};

export const apiFetch = async <T>(params: FetcherParams, init?: RequestInit): Promise<T> => {
  const response = await fetch(getRequestUrl(params), init);

  if (!response.ok) {
    const body = await response.text();
    const error = new ApiError(getErrorMessage(body) || "Request Failed");
    error.status = response.status;
    error.body = body;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get("content-type");

  if (contentType?.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as T;
};
