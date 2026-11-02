import { expect, test } from "@playwright/test";
import { mockApi } from "./fixtures";

const paused = { enabled: false, message: "운영 준비가 완료되면 다시 안내드리겠습니다." };

test("paused enrollment shows a notice instead of inputs and keeps login available", async ({ page }, info) => {
  await mockApi(page);
  await page.route("**/api/auth/registration", route => route.fulfill({ json: paused }));
  let posts = 0;
  await page.route("**/api/auth/signup", route => { posts++; return route.fulfill({ status: 503, json: { code: "SIGNUP_PAUSED" } }); });
  await page.goto("/signup");
  await expect(page.getByRole("heading", { name: "회원가입을 잠시 중단했습니다." })).toBeVisible();
  await expect(page.locator("main input")).toHaveCount(0);
  await expect(page.locator("main form")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("signup-paused.png"), fullPage: true });
  await page.setViewportSize({ width: 320, height: 800 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.locator("main").getByRole("link", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole("button", { name: "로그인", exact: true })).toBeEnabled();
  expect(posts).toBe(0);
});

test("signup stays closed until a successful status response and can recover from errors", async ({ page }) => {
  await mockApi(page);
  let attempts = 0;
  await page.route("**/api/auth/registration", route => {
    attempts++;
    if (attempts === 1) return route.fulfill({ status: 503, json: { message: "temporary test failure" } });
    if (attempts === 2) return route.fulfill({ json: {} });
    return route.fulfill({ json: { enabled: true, message: "" } });
  });
  await page.goto("/signup");
  await expect(page.locator("main").getByRole("alert")).toContainText("가입 가능 여부를 확인하지 못했습니다.");
  await expect(page.locator("main input")).toHaveCount(0);
  await page.getByRole("button", { name: "다시 확인" }).click();
  await expect.poll(() => attempts).toBe(2);
  await expect(page.locator("main").getByRole("alert")).toBeVisible();
  await expect(page.locator("main input")).toHaveCount(0);
  await page.getByRole("button", { name: "다시 확인" }).click();
  await expect(page.getByLabel("아이디", { exact: true })).toBeEnabled();
});

test("status loading never exposes a usable signup form", async ({ page }) => {
  await mockApi(page);
  let release!: () => void;
  const pending = new Promise<void>(resolve => { release = resolve; });
  await page.route("**/api/auth/registration", async route => {
    await pending;
    await route.fulfill({ json: paused });
  });
  await page.goto("/signup");
  await expect(page.getByText("가입 가능 여부를 확인하고 있습니다.")).toBeVisible();
  await expect(page.locator("main input")).toHaveCount(0);
  release();
  await expect(page.getByRole("heading", { name: "회원가입을 잠시 중단했습니다." })).toBeVisible();
});

test("a form opened before the pause switches to the notice when the server rejects signup", async ({ page }) => {
  await mockApi(page);
  let posts = 0;
  await page.route("**/api/auth/signup", route => {
    posts++;
    return route.fulfill({ status: 503, json: { code: "SIGNUP_PAUSED", message: paused.message } });
  });
  await page.goto("/signup");
  await page.getByLabel("아이디", { exact: true }).fill("synthetic62");
  await page.getByLabel("이름", { exact: true }).fill("가상동문");
  await page.getByLabel("비밀번호", { exact: true }).fill("test-password-62");
  await page.getByLabel("비밀번호 확인", { exact: true }).fill("test-password-62");
  await page.getByLabel("이메일", { exact: true }).fill("synthetic@example.invalid");
  await page.getByLabel("휴대폰 번호", { exact: true }).fill("010-0000-0062");
  await page.locator("select[name=classNo]").selectOption("62");
  for (const name of ["termsAgreed", "privacyAgreed", "ageConfirmed"]) await page.locator(`input[name=${name}]`).check();
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  await expect(page.getByRole("heading", { name: "회원가입을 잠시 중단했습니다." })).toBeVisible();
  await expect(page.locator("main input")).toHaveCount(0);
  expect(posts).toBe(1);
  await expect(page).toHaveURL(/\/signup$/);
});
