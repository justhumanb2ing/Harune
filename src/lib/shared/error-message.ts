function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function extractMessage(value: unknown): string | null {
  if (typeof value === "string") {
    return value;
  }

  if (value instanceof Error) {
    return value.message || null;
  }

  if (!isRecord(value)) {
    return null;
  }

  if (typeof value.message === "string") {
    return value.message;
  }

  if (typeof value.error === "string") {
    return value.error;
  }

  if (isRecord(value.error)) {
    if (typeof value.error.message === "string") {
      return value.error.message;
    }

    if (typeof value.error.error === "string") {
      return value.error.error;
    }
  }

  return null;
}

export function getErrorMessage(value: unknown, fallback = "Unexpected error") {
  return extractMessage(value) || fallback;
}
