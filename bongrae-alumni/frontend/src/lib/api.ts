export type Member = {
  id: number;
  username: string;
  name: string;
  role: string;
  classNo: number | null;
  graduationYear: number | null;
};
export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  size: number;
  pages: number;
};
export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
  ) {
    super(message);
  }
}
export async function api<T>(
  url: string,
  options: RequestInit = {},
): Promise<T> {
  const headers = new Headers(options.headers);
  const method = options.method ?? "GET";
  if (method !== "GET" && method !== "HEAD") {
    const tokenResponse = await fetch("/api/auth/csrf", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!tokenResponse.ok)
      throw new ApiError(
        "서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.",
        tokenResponse.status,
      );
    const csrf = await tokenResponse.json();
    headers.set(csrf.headerName, csrf.token);
    if (options.body && !(options.body instanceof FormData))
      headers.set("Content-Type", "application/json");
  }
  const response = await fetch(url, {
    ...options,
    headers,
    credentials: "same-origin",
    cache: "no-store",
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new ApiError(
      body.message ?? "요청을 처리하지 못했습니다. 잠시 후 다시 시도해 주세요.",
      response.status,
    );
  }
  return response.status === 204 ? (undefined as T) : response.json();
}
export function message(error: unknown) {
  return error instanceof Error ? error.message : "요청을 처리하지 못했습니다.";
}
export const isAdmin = (user: Member | null) =>
  !!user && ["ADMIN", "SUPER_ADMIN"].includes(user.role);
export const POLICY_VERSION = "2026-10-14";
export const boardNames: Record<string, string> = {
  announcements: "공지사항",
  events: "행사 안내",
  gallery: "행사 사진 및 영상",
  affairs: "주요 회무 추진",
  free: "자유게시판",
};
export const boardPath = (slug: string) =>
  slug === "free" ? "/board/free" : `/notice/${slug}`;
export const dateText = (value: string) =>
  value?.slice(0, 10).replaceAll("-", ".");
