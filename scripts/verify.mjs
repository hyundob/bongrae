import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const app = path.join(root, "bongrae-alumni");
const frontend = path.join(app, "frontend");
const backend = path.join(app, "backend");
const target = process.argv[2] || "all";
const targets = ["all", "frontend", "backend", "backend-unit", "infra"];

if (target === "--help") {
  console.log(`Usage: node scripts/verify.mjs [${targets.join("|")}]`);
  console.log("Requires Node.js 22, JDK 21, Docker, Git Bash (Windows), Python 3.");
  console.log("backend-unit omits PostgreSQL tests and is not a full quality gate.");
  process.exit(0);
}
if (!targets.includes(target) || process.argv.length > 3) {
  console.error("Invalid target. Run node scripts/verify.mjs --help");
  process.exit(2);
}

const windows = process.platform === "win32";
const env = { ...process.env, NEXT_TELEMETRY_DISABLED: "1" };
const results = [];
const startedAt = new Date().toISOString();
const reportDir = path.join(root, ".harness");
mkdirSync(reportDir, { recursive: true });
// Each scope replaces its old report, including when a prerequisite fails.
const reportFile = path.join(reportDir, `verify-${target}.json`);
function saveReport(status) {
  writeFileSync(reportFile, JSON.stringify({ target, startedAt, status, results }, null, 2));
}
saveReport("running");

function run(name, command, args, cwd = root, extraEnv = {}) {
  console.log(`\n[verify] ${name}`);
  const start = Date.now();
  const result = spawnSync(command, args, {
    cwd, env: { ...env, ...extraEnv }, stdio: "inherit", windowsHide: true,
  });
  const passed = !result.error && result.status === 0;
  results.push({ name, status: passed ? "passed" : "failed", exitCode: result.status,
    durationMs: Date.now() - start, error: result.error?.message });
  saveReport("running");
  if (!passed) throw new Error(`${name} failed${result.error ? `: ${result.error.message}` : ""}`);
}

function npm(name, args) {
  // Only fixed repository-owned arguments reach cmd.exe; no user shell input.
  if (windows) run(name, process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `npm.cmd ${args.join(" ")}`], frontend);
  else run(name, "npm", args, frontend);
}

function gradle(tasks) {
  const args = [...tasks, "--no-daemon", "--console=plain"];
  if (windows) run("Backend tests and build", process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", `gradlew.bat ${args.join(" ")}`], backend);
  else run("Backend tests and build", "bash", ["./gradlew", ...args], backend);
}

const checks = {
  frontend() {
    npm("Install locked frontend dependencies", ["ci", "--no-audit", "--no-fund"]);
    npm("Frontend lint", ["run", "lint"]);
    npm("Frontend type check", ["run", "typecheck"]);
    npm("Frontend production build", ["run", "build"]);
    npm("Install Chromium", ["exec", "--", "playwright", "install", ...(process.env.CI && !windows ? ["--with-deps"] : []), "chromium"]);
    npm("Desktop and mobile browser tests", ["run", "test:e2e"]);
  },
  backend() {
    run("Docker engine for disposable PostgreSQL", "docker", ["info", "--format", "{{.ServerVersion}}"]);
    gradle(["clean", "test", "integrationTest", "bootJar"]);
  },
  "backend-unit"() {
    gradle(["clean", "test", "bootJar"]);
  },
  infra() {
    run("Whitespace errors", "git", ["diff", "--check"]);
    const safeEnv = {
      POSTGRES_DB: "harness", POSTGRES_USER: "harness", POSTGRES_PASSWORD: "harness-only",
      JWT_SECRET: "harness-only-never-use-in-production", DOMAIN: "localhost",
      SPRING_PROFILES_ACTIVE: "prod", FILE_UPLOAD_PATH: "/app/uploads", TZ: "Asia/Seoul",
      BACKEND_IMAGE: "bongrae-alumni-backend:harness", FRONTEND_IMAGE: "bongrae-alumni-frontend:harness",
    };
    for (const [name, files] of [
      ["Production Compose", ["docker-compose.yml"]],
      ["Development Compose", ["docker-compose.dev.yml"]],
      ["HTTPS image deployment Compose", ["docker-compose.yml", "docker-compose.https.yml", "deploy/docker-compose.images.yml"]],
    ]) {
      run(name, "docker", ["compose", "--env-file", ".env.example", ...files.flatMap(file => ["-f", file]), "config", "--quiet"], app, safeEnv);
    }
    const bash = windows
      ? (process.env.BASH_PATH || ["C:/Program Files/Git/bin/bash.exe", "C:/Program Files (x86)/Git/bin/bash.exe"].find(existsSync))
      : "bash";
    if (!bash) throw new Error("Install Git Bash or set BASH_PATH to bash.exe.");
    run("Deployment and rollback tests (mocked)", bash, ["bongrae-alumni/deploy/test-deploy.sh"]);
  },
};

let failed = false;
for (const scope of target === "all" ? ["frontend", "backend", "infra"] : [target]) {
  try {
    checks[scope]();
  } catch (error) {
    failed = true;
    console.error(`[verify] ${error.message}`);
    results.push({ name: scope, status: "failed", error: error.message });
  }
}
saveReport(failed ? "failed" : "passed");
console.log(`\n[verify] ${failed ? "FAILED" : "PASSED"}: ${target}. Report: ${reportFile}`);
process.exitCode = failed ? 1 : 0;
