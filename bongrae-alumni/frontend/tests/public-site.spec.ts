import { expect, test } from "@playwright/test";
import { mockApi, samplePost } from "./fixtures";
test.beforeEach(async ({ page }) => {
  await mockApi(page);
});
test("home renders identity and real assets without overflow", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    "봉래초등학교 총동문회",
  );
  await expect(page.getByRole("navigation", { name: "주 메뉴" })).toBeVisible();
  for (const alt of ["봉래초등학교 교표", "봉래초등학교 전경"]) {
    const image = page.getByRole("img", { name: alt, exact: true });
    await expect(image).toBeVisible();
    await expect
      .poll(() =>
        image.evaluate(
          (e: HTMLImageElement) => e.complete && e.naturalWidth > 0,
        ),
      )
      .toBe(true);
  }
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({ path: info.outputPath("home.png"), fullPage: true });
  expect(errors).toEqual([]);
});
test("primary navigation reaches the alumni introduction", async ({ page }) => {
  await page.goto("/");
  await page
    .getByRole("navigation", { name: "주 메뉴" })
    .getByRole("link", { name: "총동문회 소개", exact: true })
    .click();
  await expect(page).toHaveURL(/\/about\/greeting$/);
  await expect(page.locator("main")).toContainText("총동문회");
});
for (const [source, destination] of [
  ["/about", "/about/greeting"],
  ["/school", "/school/history"],
  ["/rules", "/about/rules"],
  ["/boards?type=event", "/notice/events"],
  ["/boards?type=gallery", "/notice/gallery"],
]) {
  test(`legacy route ${source} redirects to ${destination}`, async ({
    page,
  }) => {
    const response = await page.goto(source);
    expect(response?.status()).toBe(200);
    expect(new URL(page.url()).pathname).toBe(destination);
    await expect(page.locator("main")).not.toBeEmpty();
  });
}
test("home reads board data and recovers from an API failure", async ({
  page,
}) => {
  let fail = true;
  await page.route("**/api/boards/announcements/posts", (route) =>
    route.fulfill(
      fail
        ? { status: 503, json: { message: "unavailable" } }
        : {
            json: {
              items: [samplePost],
              total: 1,
              page: 0,
              pages: 1,
              size: 20,
            },
          },
    ),
  );
  await page.goto("/");
  await expect(page.locator("main").getByRole("alert")).toHaveText(
    "소식을 불러오지 못했습니다.",
  );
  fail = false;
  await page.getByRole("button", { name: "다시 시도" }).click();
  await expect(
    page.getByRole("link", { name: samplePost.title }),
  ).toBeVisible();
});
