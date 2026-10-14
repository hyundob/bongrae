import type { Page } from "@playwright/test";
export const member = {
  id: 1,
  username: "member62",
  name: "테스트동문",
  role: "MEMBER",
  classNo: 62,
  graduationYear: 1989,
};
export const samplePost = {
  id: 21,
  title: "가상 동문 행사 안내",
  author_name: "테스트관리",
  created_at: "2026-10-14T09:00:00",
  body: "테스트 게시글 본문입니다.",
  version: 0,
  canEdit: true,
  media: [],
};
export async function mockApi(page: Page, user: typeof member | null = null) {
  await page.route("**/api/**", async (route) => {
    const path = new URL(route.request().url()).pathname;
    if (path === "/api/auth/me")
      return route.fulfill({
        status: user ? 200 : 401,
        json: user ?? { message: "로그인이 필요합니다." },
      });
    if (path === "/api/auth/csrf")
      return route.fulfill({
        json: { token: "test-csrf", headerName: "X-CSRF-TOKEN" },
      });
    if (path === "/api/account")
      return route.fulfill({
        json: {
          ...member,
          email: "member@example.invalid",
          phone: "01000000062",
          smsAgreed: false,
          emailAgreed: false,
          directoryAgreed: false,
        },
      });
    if (/\/posts$/.test(path))
      return route.fulfill({
        json: { items: [], total: 0, page: 0, size: 20, pages: 0 },
      });
    return route.fulfill({
      status: 404,
      json: { message: "테스트 경로 없음" },
    });
  });
}
