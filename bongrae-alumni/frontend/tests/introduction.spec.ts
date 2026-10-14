import { expect, test } from "@playwright/test";
import { menuGroups, executives, historyItems, rules, pastPrincipals, presidentGreeting, associationContact } from "../src/lib/site";
import { mockApi } from "./fixtures";

test.beforeEach(async ({ page }) => {
  await mockApi(page);
});

test("top-level introduction menus open their first content page", async ({ page }) => {
  await page.goto("/");
  for (const [label, path] of [
    ["총동문회 소개", "/about/greeting"],
    ["모교소개", "/school/history"],
    ["알림마당", "/notice/announcements"],
  ]) {
    await page.getByRole("navigation", { name: "주 메뉴" }).getByRole("link", { name: label, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${path}$`));
    await expect(page.getByRole("navigation", { name: "하위 메뉴" })).toBeVisible();
  }
});

for (const group of menuGroups.filter((group) => ["총동문회 소개", "모교소개"].includes(group.title))) {
  for (const item of group.items) {
    test(`${item.href} retains its section navigation and fits the viewport`, async ({ page }, info) => {
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      await page.goto(item.href);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(item.title);
      const nav = page.getByRole("navigation", { name: "하위 메뉴" });
      await expect(nav.getByRole("link")).toHaveCount(group.items.length);
      await expect(nav.locator('[aria-current="page"]')).toHaveCount(1);
      await expect(nav.locator('[aria-current="page"]')).toBeInViewport({ ratio: 1 });
      await expect(nav.getByRole("link", { name: item.title, exact: true })).toHaveAttribute("aria-current", "page");
      for (const link of group.items) {
        await expect(nav.getByRole("link", { name: link.title, exact: true })).toHaveAttribute("href", link.href);
      }
      for (const img of await page.locator("main img").all()) {
        await img.scrollIntoViewIfNeeded();
        await expect.poll(() => img.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
      }
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      await page.evaluate(() => window.scrollTo(0, 0));
      await page.screenshot({ path: info.outputPath("introduction.png"), fullPage: true });
      const destination = group.items[(group.items.indexOf(item) + 1) % group.items.length];
      await nav.getByRole("link", { name: destination.title, exact: true }).click();
      await expect(page).toHaveURL(new RegExp(`${destination.href}$`));
      expect(errors).toEqual([]);
    });
  }
}

test("source records and chapter anchors remain complete", async ({ page }) => {
  await page.goto("/school/history");
  await expect(page.locator(".chronology-entry")).toHaveCount(historyItems.length);
  await page.goto("/about/executives");
  await expect(page.locator(".executive-person")).toHaveCount(executives.length);
  await page.goto("/school/past-principals");
  await expect(page.locator("tbody tr")).toHaveCount(pastPrincipals.length);
  await page.goto("/about/rules");
  await expect(page.locator(".rule-article")).toHaveCount(rules.length);
  await page.getByRole("navigation", { name: "회칙 목차" }).getByRole("link", { name: "부 칙", exact: true }).click();
  await expect(page).toHaveURL(/#chapter-5$/);
  await expect(page.locator("#chapter-5")).toBeInViewport();
});

test("school source details expand and collapse", async ({ page }) => {
  await page.goto("/school/overview");
  for (const label of ["학교의 시작과 교명의 변천", "새 교가가 만들어지기까지"]) {
    const summary = page.locator("summary", { hasText: label });
    const details = page.locator("details").filter({ has: summary });
    await expect(details).not.toHaveAttribute("open");
    await summary.click();
    await expect(details).toHaveAttribute("open");
    await expect(details.locator("h2").first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await summary.click();
    await expect(details).not.toHaveAttribute("open");
  }
});

test("introduction pages also fit a compact 320px viewport", async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 740 });
  for (const path of ["/about/greeting", "/about/executives", "/about/rules", "/school/history", "/school/past-principals", "/school/directions"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("navigation", { name: "하위 메뉴" }).locator('[aria-current="page"]')).toBeInViewport({ ratio: 1 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  }
});

test("president greeting is published in full with office and donation details", async ({ page }) => {
  await page.goto("/about/greeting");
  const letter = page.getByRole("article", { name: presidentGreeting.headline });
  await expect(letter).toBeVisible();
  await expect(letter.getByRole("heading", { level: 2 })).toHaveText(presidentGreeting.headline);
  await expect(letter.locator(".president-letter-body p")).toHaveText(presidentGreeting.paragraphs);
  await expect(letter.locator(".president-signature")).toContainText(presidentGreeting.signerName);
  await expect(page.locator("main")).not.toContainText("준비 중");
  const footer = page.getByRole("contentinfo");
  await expect(footer.locator("address")).toContainText(associationContact.officeAddress);
  await expect(footer.locator("address")).toContainText(associationContact.postalCode);
  const donation = footer.getByRole("region", { name: "후원금 계좌 안내" });
  await expect(donation).toContainText(associationContact.donation.bank);
  await expect(donation).toContainText(associationContact.donation.accountNumber);
  await expect(donation).toContainText(associationContact.donation.accountHolder);
  await page.goto("/school/directions");
  await expect(page.locator("main")).toContainText("전라남도 고흥군 봉래면 신금길 7");
  await expect(page.locator("main")).not.toContainText(associationContact.officeAddress);
});
