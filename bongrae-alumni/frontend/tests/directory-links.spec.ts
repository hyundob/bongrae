import { expect, test } from "@playwright/test";
import { member, mockApi } from "./fixtures";

const review = { user_id: 71, name: "가상동문", username: "synthetic71", class_no: 62,
  reason: "MULTIPLE_RECORDS", status: "PENDING", candidate_count: 3, record_id: null,
  created_at: "2026-10-14T10:00:00", reviewed_at: null };
const candidates = [
  { id: 81, name: "가상동문", class_no: 62, graduation_year: 1989, hometown: "가상마을가", user_id: null, linked_username: null },
  { id: 82, name: "가상동문", class_no: 62, graduation_year: 1989, hometown: "가상마을나", user_id: null, linked_username: null },
  { id: 83, name: "가상동문", class_no: 62, graduation_year: 1989, hometown: null, user_id: 72, linked_username: "synthetic72" },
];

test("administrator compares candidates and confirms an explicit link", async ({ page }, info) => {
  await mockApi(page, { ...member, role: "ADMIN" });
  let status = "PENDING";
  let decision: unknown;
  const queries: string[] = [];
  await page.route("**/api/admin/directory-links?*", route => {
    const params = new URL(route.request().url()).searchParams;
    queries.push(params.toString());
    const items = params.get("status") === status ? [{ ...review, status }] : [];
    return route.fulfill({ json: { items, total: items.length, page: 0, size: 20, pages: items.length } });
  });
  await page.route("**/api/admin/directory-links/71", route => {
    if (route.request().method() === "POST") {
      decision = route.request().postDataJSON(); status = "LINKED";
      return route.fulfill({ status: 204 });
    }
    return route.fulfill({ json: { review: { ...review, status, record_id: status === "LINKED" ? 82 : null }, candidates } });
  });
  await page.goto("/admin");
  await page.getByRole("tab", { name: "회원 연결 확인" }).click();
  await expect(page.getByText("확인 대기 1명", { exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "가상동문 (synthetic71) 연결 확인", exact: true })).toBeInViewport({ ratio: 1 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("link-review-list.png"), fullPage: true });
  await page.getByRole("button", { name: "가상동문 (synthetic71) 연결 확인", exact: true }).click();
  await expect(page.getByRole("radio", { name: "명부 83, 지역 미상", exact: true })).toBeDisabled();
  await expect(page.getByText("연결됨 (synthetic72)")).toBeVisible();
  await expect(page.getByRole("button", { name: "연결 확정", exact: true })).toBeDisabled();
  await page.getByRole("radio", { name: "명부 82, 가상마을나", exact: true }).check();
  await expect(page.getByRole("button", { name: "연결 확정", exact: true })).toBeDisabled();
  await page.getByRole("checkbox", { name: "본인 및 명부 일치를 확인했습니다" }).check();
  await page.getByRole("radio", { name: "명부 81, 가상마을가", exact: true }).check();
  await expect(page.getByRole("checkbox", { name: "본인 및 명부 일치를 확인했습니다" })).not.toBeChecked();
  await page.getByRole("radio", { name: "명부 82, 가상마을나", exact: true }).check();
  await page.getByRole("checkbox", { name: "본인 및 명부 일치를 확인했습니다" }).check();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("link-review-detail.png"), fullPage: true });
  await page.getByRole("button", { name: "연결 확정", exact: true }).click();
  await expect.poll(() => decision).toEqual({ decision: "LINK", recordId: 82 });
  await expect(page.getByText("회원과 동문 명부를 연결했습니다.", { exact: true })).toBeVisible();
  await expect(page.getByText("확인 대기 중인 회원이 없습니다.")).toBeVisible();
  await page.getByLabel("연결 처리 상태").selectOption("LINKED");
  await expect(page.getByText("연결 완료 1명", { exact: true })).toBeVisible();
  await page.getByLabel("연결 확인 회원 이름").fill("가상");
  await page.getByRole("button", { name: "연결 확인 검색", exact: true }).click();
  await expect.poll(() => queries.some(q => new URLSearchParams(q).get("name") === "가상")).toBe(true);
  await page.getByRole("button", { name: "가상동문 (synthetic71) 연결 확인", exact: true }).click();
  await expect(page.getByRole("button", { name: "연결 확정", exact: true })).toHaveCount(0);
  await expect(page.getByRole("radio", { name: "명부 82, 가상마을나", exact: true })).toBeChecked();
});

test("stale claims reload candidates and exclusion requires confirmation", async ({ page }) => {
  await mockApi(page, { ...member, role: "SUPER_ADMIN" });
  let occupied = false;
  let dismissed = false;
  const decisions: unknown[] = [];
  await page.route("**/api/admin/directory-links?*", route => route.fulfill({ json: {
    items: dismissed ? [] : [review], total: dismissed ? 0 : 1, page: 0, size: 20, pages: dismissed ? 0 : 1,
  } }));
  await page.route("**/api/admin/directory-links/71", route => {
    if (route.request().method() === "POST") {
      const decision = route.request().postDataJSON(); decisions.push(decision);
      if (decision.decision === "DISMISS") { dismissed = true; return route.fulfill({ status: 204 }); }
      occupied = true;
      return route.fulfill({ status: 409, json: { message: "이미 다른 회원에게 연결되었습니다." } });
    }
    return route.fulfill({ json: { review, candidates: occupied ? candidates.map(item => ({ ...item, user_id: 72, linked_username: "synthetic72" })) : candidates } });
  });
  await page.goto("/admin");
  await page.getByRole("tab", { name: "회원 연결 확인" }).click();
  await page.getByRole("button", { name: "가상동문 (synthetic71) 연결 확인", exact: true }).click();
  await page.getByRole("radio", { name: "명부 81, 가상마을가", exact: true }).check();
  await page.getByRole("checkbox", { name: "본인 및 명부 일치를 확인했습니다" }).check();
  await page.getByRole("button", { name: "연결 확정", exact: true }).click();
  await expect(page.getByRole("tabpanel").getByRole("alert")).toHaveText("이미 다른 회원에게 연결되었습니다.");
  await expect(page.getByRole("radio", { name: "명부 81, 가상마을가", exact: true })).toBeDisabled();
  await expect(page.getByRole("checkbox", { name: "본인 및 명부 일치를 확인했습니다" })).not.toBeChecked();
  await expect(page.getByText("연결 가능한 명부가 없습니다.")).toBeVisible();
  page.once("dialog", dialog => dialog.dismiss());
  await page.getByRole("button", { name: "연결 제외", exact: true }).click();
  expect(decisions).toHaveLength(1);
  page.once("dialog", dialog => dialog.accept());
  await page.getByRole("button", { name: "연결 제외", exact: true }).click();
  await expect.poll(() => decisions).toContainEqual({ decision: "DISMISS", recordId: null });
  await expect(page.getByText("연결 확인 대상에서 제외했습니다.", { exact: true })).toBeVisible();
});

test("review list can recover from errors and fits a narrow screen", async ({ page }) => {
  await mockApi(page, { ...member, role: "ADMIN" });
  let failed = true;
  await page.route("**/api/admin/directory-links?*", route => failed
    ? route.fulfill({ status: 503, json: { message: "연결 목록을 불러올 수 없습니다." } })
    : route.fulfill({ json: { items: [], total: 0, page: 0, size: 20, pages: 0 } }));
  await page.setViewportSize({ width: 320, height: 740 });
  await page.goto("/admin");
  await page.getByRole("tab", { name: "회원 연결 확인" }).click();
  await expect(page.getByRole("tabpanel").getByRole("alert")).toHaveText("연결 목록을 불러올 수 없습니다.");
  failed = false;
  await page.getByRole("button", { name: "연결 확인 새로고침", exact: true }).click();
  await expect(page.getByText("확인 대기 중인 회원이 없습니다.")).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
});
