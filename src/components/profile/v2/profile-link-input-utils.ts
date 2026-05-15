const URL_PROTOCOL_PATTERN = /^[a-zA-Z][a-zA-Z\d+\-.]*:/;

export const normalizeLinkInputUrl = (value: string) => {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return "";
  }

  if (URL_PROTOCOL_PATTERN.test(trimmedValue)) {
    return trimmedValue;
  }

  if (trimmedValue.startsWith("//")) {
    return `https:${trimmedValue}`;
  }

  return `https://${trimmedValue}`;
};
