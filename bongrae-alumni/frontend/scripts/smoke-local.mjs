// Explicit local-only end-to-end check. Creates synthetic data and removes it in finally.
import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { readFile } from "node:fs/promises";
import { chromium } from "@playwright/test";

const base = new URL(process.env.SMOKE_BASE_URL || "http://127.0.0.1:8088");
if (!["127.0.0.1", "localhost", "[::1]"].includes(base.hostname)) {
  throw new Error(
    "This smoke check may only run against a local development server.",
  );
}
const suffix = randomBytes(5).toString("hex");
const username = `qa_${suffix}`;
const password = randomBytes(20).toString("hex");
const name = `검증동문${suffix}`;
const browser = await chromium.launch();
const context = await browser.newContext({ baseURL: base.origin });
const page = await context.newPage();
const errors = [];
page.on("pageerror", (error) => errors.push(error.message));
let accountCreated = false;
let postId;
async function mutate(method, path, data) {
  const response = await context.request.get("/api/auth/csrf");
  assert.equal(response.status(), 200);
  const csrf = await response.json();
  return context.request.fetch(path, {
    method,
    data,
    headers: { [csrf.headerName]: csrf.token },
  });
}
try {
  await page.goto("/signup");
  await page.locator("input[name=username]").fill(username);
  await page.locator("input[name=name]").fill(name);
  await page.locator("input[name=password]").fill(password);
  await page.locator("input[name=passwordConfirm]").fill(password);
  await page.locator("input[name=email]").fill(`${username}@example.invalid`);
  await page.locator("input[name=phone]").fill("01000000000");
  await page.locator("select[name=classNo]").selectOption("62");
  for (const field of [
    "termsAgreed",
    "privacyAgreed",
    "ageConfirmed",
    "directoryAgreed",
  ]) {
    await page.locator(`input[name=${field}]`).check();
  }
  const signedUp = page.waitForResponse((response) =>
    response.url().endsWith("/api/auth/signup"),
  );
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  assert.equal((await signedUp).status(), 200);
  accountCreated = true;
  await page.waitForURL("**/account");
  await page.goto("/alumni/search");
  await page.getByLabel("이름", { exact: true }).fill(name);
  await page
    .locator("main")
    .getByRole("button", { name: "검색", exact: true })
    .click();
  await page.getByRole("cell", { name, exact: true }).waitFor();

  await page.goto("/board/free?write=1");
  const title = `통합검증 ${suffix}`;
  await page.getByLabel("제목", { exact: true }).fill(title);
  await page
    .getByLabel("내용", { exact: true })
    .fill("로컬 검증용 가상 게시글입니다.");
  const uploaded = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/media") &&
      response.request().method() === "POST",
  );
  await page
    .locator("input[type=file]")
    .setInputFiles({
      name: "qa-logo.png",
      mimeType: "image/png",
      buffer: await readFile(
        new URL("../public/images/logo.png", import.meta.url),
      ),
    });
  assert.equal((await uploaded).status(), 201);
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await page.waitForURL(/post=\d+/);
  postId = new URL(page.url()).searchParams.get("post");
  await page.getByRole("heading", { name: title, exact: true }).waitFor();
  const image = page.getByRole("img", { name: "qa-logo.png", exact: true });
  await image.waitFor();
  await image.evaluate((img) => img.decode());
  await page.getByRole("link", { name: "수정", exact: true }).click();
  await page.getByLabel("제목", { exact: true }).fill(`${title} 수정`);
  await page.getByRole("button", { name: "저장", exact: true }).click();
  await page
    .getByRole("heading", { name: `${title} 수정`, exact: true })
    .waitFor();
  assert.equal(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    true,
  );
  await page.goto("/notice/announcements?write=1");
  await page
    .getByText("관리자만 작성할 수 있습니다.", { exact: true })
    .waitFor();
  assert.equal(
    (
      await mutate("POST", "/api/boards/announcements/posts", {
        title,
        body: "권한 검사",
        mediaIds: [],
        version: 0,
      })
    ).status(),
    403,
  );
  assert.deepEqual(errors, []);
  console.log(
    "PASS: real browser signup, session, directory, photo upload, post create/edit and admin denial.",
  );
} catch (error) {
  console.error(
    "Visible errors:",
    await page.locator("main [role=alert]").allTextContents(),
  );
  console.error(
    "Invalid fields:",
    await page
      .locator("input:invalid,select:invalid")
      .evaluateAll((fields) =>
        fields.map((field) => ({
          name: field.name,
          reason: field.validationMessage,
        })),
      ),
  );
  console.error("Browser errors:", errors);
  throw error;
} finally {
  try {
    if (accountCreated) {
      const me = await (await context.request.get("/api/auth/me")).json();
      assert.equal(
        me.username,
        username,
        "Refusing to clean up an unrelated account",
      );
      if (postId) {
        const post = await (
          await context.request.get(`/api/boards/free/posts/${postId}`)
        ).json();
        assert.equal(
          (
            await mutate(
              "DELETE",
              `/api/boards/free/posts/${postId}?version=${post.version}`,
            )
          ).status(),
          204,
        );
      }
      assert.equal(
        (await mutate("DELETE", "/api/account", { password })).status(),
        204,
      );
      console.log("PASS: synthetic post, attachment and account removed.");
    }
  } finally {
    await browser.close();
  }
}
