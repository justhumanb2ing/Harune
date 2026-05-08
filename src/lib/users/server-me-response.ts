import type { GetMe200 } from "@/lib/api/generated/http/schemas/me-api";

export async function parseServerMeResponse(response: Response): Promise<GetMe200 | null> {
  if (response.status === 401) {
    return null;
  }

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as GetMe200;
}
