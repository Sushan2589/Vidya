export async function adminRequest<T>(
  url: string,
  options?: RequestInit,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers: {
        ...(options?.body instanceof FormData
          ? {}
          : { "Content-Type": "application/json" }),
        ...options?.headers,
      },
      cache: "no-store",
    });
  } catch {
    throw new Error(
      "The connection was interrupted, so this action could not be confirmed. Check your article list before retrying a save.",
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(
      typeof data.error === "string"
        ? data.error
        : response.status === 401
          ? "Your session has expired. Sign in again in another tab, then retry."
          : "The server could not complete this action. Please try again.",
    );
  return data as T;
}
export const adminInputClass =
  "w-full rounded-lg border border-[#16324F]/25 bg-white px-3.5 py-2.5 text-sm text-[#16324F] outline-none focus:border-[#866a15] focus:ring-2 focus:ring-[#C9A227]/30 disabled:opacity-60";
export const adminButtonClass =
  "inline-flex items-center justify-center gap-2 rounded-full bg-[#16324F] px-5 py-2.5 text-sm font-medium text-[#F3F1EA] hover:bg-[#1D3F63] disabled:cursor-wait disabled:opacity-60";
