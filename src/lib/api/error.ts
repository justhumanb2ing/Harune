export class ApiError extends Error {
  status?: number;
  body?: string;
}

type ApiErrorResponseBody = {
  description?: string;
  error?: string | { description?: string; message?: string; code?: string };
  message?: string;
};

const getErrorText = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as {
    code?: unknown;
    description?: unknown;
    message?: unknown;
  };

  return (
    getErrorText(record.message) || getErrorText(record.description) || getErrorText(record.code)
  );
};

const getErrorDescription = (value: unknown): string | undefined => {
  if (typeof value === "string") {
    return value;
  }

  if (!value || typeof value !== "object") {
    return undefined;
  }

  const record = value as {
    description?: unknown;
    message?: unknown;
  };

  return getErrorText(record.description) || getErrorText(record.message);
};

const getErrorMessage = (body: string): string => {
  try {
    const parsed = JSON.parse(body) as ApiErrorResponseBody;
    return getErrorText(parsed.error) || getErrorText(parsed.message) || body;
  } catch {
    return body;
  }
};

export const getApiErrorDescription = (error: unknown): string | undefined => {
  if (!(error instanceof ApiError) || !error.body) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(error.body) as ApiErrorResponseBody;
    return getErrorDescription(parsed.description) || getErrorDescription(parsed.error);
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
