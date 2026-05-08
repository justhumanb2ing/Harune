export async function uploadToPresignedUrl({
  file,
  uploadUrl,
  contentType,
}: {
  file: Blob;
  uploadUrl: string;
  contentType?: string;
}) {
  const response = await fetch(uploadUrl, {
    method: "PUT",
    headers: contentType ? { "Content-Type": contentType } : undefined,
    body: file,
  });

  if (!response.ok) {
    throw new Error(`Failed to upload file: ${response.status}`);
  }

  return response;
}
