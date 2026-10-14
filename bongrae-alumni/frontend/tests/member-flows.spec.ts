import { expect, test } from "@playwright/test";
import { member, mockApi, samplePost } from "./fixtures";

test("auth forms cannot submit before hydration", async ({
  browser,
  baseURL,
}) => {
  const context = await browser.newContext({
    javaScriptEnabled: false,
    baseURL,
  });
  try {
    const page = await context.newPage();
    for (const [path, name] of [
      ["/signup", "회원가입"],
      ["/login", "로그인"],
    ]) {
      await page.goto(path);
      await expect(page.locator("input[name=username]")).toBeDisabled();
      await expect(
        page.getByRole("button", { name, exact: true }),
      ).toBeDisabled();
    }
  } finally {
    await context.close();
  }
});

test("signup opens policies in new tabs and submits explicit consents", async ({
  page,
}, info) => {
  await mockApi(page);
  let submitted: Record<string, unknown> | null = null;
  await page.route("**/api/auth/signup", (route) => {
    submitted = route.request().postDataJSON();
    expect(route.request().headers()["x-csrf-token"]).toBe("test-csrf");
    return route.fulfill({ json: member });
  });
  await page.goto("/signup");
  for (const path of ["terms", "privacy"]) {
    const popup = page.waitForEvent("popup");
    await page
      .locator(`main a[target='_blank'][href='/legal/${path}']`)
      .click();
    const tab = await popup;
    await tab.waitForLoadState();
    await expect(tab.getByRole("heading", { level: 1 })).toBeVisible();
    await tab.close();
  }
  await page.locator("input[name=username]").fill("member62");
  await page.locator("input[name=name]").fill("테스트동문");
  await page.locator("input[name=password]").fill("test-password-62");
  await page.locator("input[name=passwordConfirm]").fill("test-password-62");
  await page.locator("input[name=email]").fill("member@example.invalid");
  await page.locator("input[name=phone]").fill("010-0000-0062");
  for (const [classNo, year] of [["1", "1927"], ["2", "1928"], ["20", "1947"], ["97", "2024"]]) {
    await page.locator("select[name=classNo]").selectOption(classNo);
    await expect(page.getByLabel("졸업 연도")).toHaveValue(`${year}년`);
  }
  await page.locator("select[name=classNo]").selectOption("62");
  await expect(page.getByLabel("졸업 연도")).toHaveValue("1989년");
  for (const field of ["smsAgreed", "emailAgreed", "directoryAgreed"])
    await expect(page.locator(`input[name=${field}]`)).not.toBeChecked();
  for (const field of ["termsAgreed", "privacyAgreed", "ageConfirmed"])
    await page.locator(`input[name=${field}]`).check();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: info.outputPath("signup.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  await expect(page).toHaveURL(/\/account$/);
  expect(submitted).toMatchObject({
    classNo: 62,
    termsAgreed: true,
    privacyAgreed: true,
    directoryAgreed: false,
    smsAgreed: false,
    emailAgreed: false,
    ageConfirmed: true,
    policyVersion: "2026-10-14",
  });
  expect(page.url()).not.toContain("password");
});

test("anonymous directory is guarded and members see registration status", async ({
  page,
}) => {
  await mockApi(page);
  let searched = false;
  await page.route("**/api/alumni?*", (route) => {
    searched = true;
    return route.fulfill({
      json: {
        items: [
          {
            name: "테스트가입",
            class_no: 62,
            graduation_year: 1989,
            registered: true,
          },
          {
            name: "테스트미가입",
            class_no: 62,
            graduation_year: 1989,
            registered: false,
          },
        ],
        total: 2,
        page: 0,
        pages: 1,
        size: 20,
      },
    });
  });
  await page.goto("/alumni/search");
  await expect(
    page.getByRole("heading", { name: "로그인이 필요합니다" }),
  ).toBeVisible();
  expect(searched).toBe(false);
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ json: member }),
  );
  await page.reload();
  await page.getByLabel("졸업 기수", { exact: true }).fill("62");
  await page
    .locator("main")
    .getByRole("button", { name: "검색", exact: true })
    .click();
  await expect(
    page.getByRole("cell", { name: "테스트가입", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("cell", { name: "미가입", exact: true }),
  ).toBeVisible();
});

test("member can write, edit and delete free posts but cannot write notices", async ({
  page,
}, info) => {
  await mockApi(page, member);
  let title = samplePost.title;
  let deleted = false;
  await page.route("**/api/boards/free/posts", (route) =>
    route.fulfill(
      route.request().method() === "POST"
        ? { status: 201, json: { id: 21 } }
        : { json: { items: [], total: 0, page: 0, pages: 0, size: 20 } },
    ),
  );
  await page.route("**/api/boards/free/posts/21*", (route) => {
    if (route.request().method() === "DELETE") {
      deleted = true;
      return route.fulfill({ status: 204 });
    }
    if (route.request().method() === "PUT") {
      title = route.request().postDataJSON().title;
      return route.fulfill({ json: { id: 21 } });
    }
    return route.fulfill({ json: { ...samplePost, title } });
  });
  await page.goto("/board/free?write=1");
  await page.getByLabel("제목", { exact: true }).fill(title);
  await page.getByLabel("내용", { exact: true }).fill("가상 게시글 내용");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(page).toHaveURL(/post=21/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await page.screenshot({ path: info.outputPath("post.png"), fullPage: true });
  await page.getByRole("link", { name: "수정", exact: true }).click();
  await page.getByLabel("제목", { exact: true }).fill("수정한 테스트 글");
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "수정한 테스트 글" }),
  ).toBeVisible();
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "게시글 삭제" }).click();
  await expect(page).toHaveURL(/\/board\/free$/);
  expect(deleted).toBe(true);
  await page.goto("/notice/announcements?write=1");
  await expect(page.getByText("관리자만 작성할 수 있습니다.")).toBeVisible();
});

test("only the overall administrator sees permission editing", async ({
  page,
}, info) => {
  await mockApi(page, { ...member, role: "SUPER_ADMIN" });
  let saved = false;
  await page.route("**/api/admin/members?*", (route) =>
    route.fulfill({
      json: { items: [member], total: 1, page: 0, pages: 1, size: 20 },
    }),
  );
  await page.route("**/api/admin/members/1/role", (route) => {
    saved = true;
    return route.fulfill({ status: 204 });
  });
  await page.goto("/admin");
  await page
    .getByRole("combobox", { name: "테스트동문 권한" })
    .selectOption("ADMIN");
  await page.screenshot({ path: info.outputPath("admin.png"), fullPage: true });
  page.on("dialog", (dialog) => dialog.accept());
  await page.getByRole("button", { name: "테스트동문 권한 저장" }).click();
  await expect.poll(() => saved).toBe(true);
  await page.route("**/api/auth/me", (route) =>
    route.fulfill({ json: { ...member, role: "ADMIN" } }),
  );
  await page.reload();
  await expect(
    page.getByRole("cell", { name: "테스트동문", exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("combobox")).toHaveCount(0);
});

test("login server validation errors remain on the form without leaking inputs", async ({
  page,
}) => {
  await mockApi(page);
  await page.route("**/api/auth/login", (route) =>
    route.fulfill({
      status: 401,
      json: { message: "아이디 또는 비밀번호를 확인해 주세요." },
    }),
  );
  await page.goto("/login");
  await page.getByLabel("아이디", { exact: true }).fill("member62");
  await page
    .getByLabel("비밀번호", { exact: true })
    .fill("test-wrong-password");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page.locator("main").getByRole("alert")).toContainText(
    "아이디 또는 비밀번호",
  );
  await expect(page).toHaveURL(/\/login$/);
});

test("administrator retains source region and graduation year when editing a directory record", async ({ page }, info) => {
  await mockApi(page, { ...member, role: "ADMIN" });
  const item = { id: 20, name: "가상자료", class_no: 20, hometown: "가상마을", graduation_year: 1947,
    source_note: "가상 명부 / 테스트 동의 확인", consent_confirmed: true, user_id: null };
  let saved: Record<string, unknown> | null = null;
  await page.route("**/api/admin/members?*", route => route.fulfill({ json: { items: [], total: 0, page: 0, pages: 0, size: 20 } }));
  await page.route("**/api/admin/directory?*", route => route.fulfill({ json: { items: [item], total: 1, page: 0, pages: 1, size: 20 } }));
  await page.route("**/api/admin/directory/20", route => {
    saved = route.request().postDataJSON();
    return route.fulfill({ json: { id: 20 } });
  });
  await page.goto("/admin");
  await page.getByRole("tab", { name: "동문 명부" }).click();
  await expect(page.getByRole("cell", { name: "가상마을", exact: true })).toBeVisible();
  await expect(page.getByRole("cell", { name: /20회\s*1947년/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("directory-source-list.png"), fullPage: true });
  await page.getByRole("button", { name: "가상자료 수정" }).click();
  await expect(page.getByLabel("명부 지역", { exact: true })).toHaveValue("가상마을");
  await expect(page.getByLabel("졸업연도", { exact: true })).toHaveValue("1947");
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({ path: info.outputPath("directory-source-editor.png"), fullPage: true });
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await expect.poll(() => saved).toMatchObject({ name: "가상자료", classNo: 20, hometown: "가상마을", graduationYear: 1947, consentConfirmed: true });
});
