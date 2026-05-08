export class ApiError extends Error {
  status?: number;
  body?: string;
}

type ApiErrorResponseBody = {
  description?: string;
  error?: string;
  message?: string;
};

const getErrorMessage = (body: string) => {
  try {
    const parsed = JSON.parse(body) as ApiErrorResponseBody;
    return parsed.error || parsed.message || body;
  } catch {
    return body;
  }
};

export const getApiErrorDescription = (error: unknown) => {
  if (!(error instanceof ApiError) || !error.body) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(error.body) as ApiErrorResponseBody;
    return parsed.description;
  } catch {
    return undefined;
  }
};

export const createApiError = (body: string, status: number) => {
  const error = new ApiError(getErrorMessage(body) || "Request Failed");
  error.status = status;
  error.body = body;
  return error;
};
