// Build without connecting to Turso or touching the developer's local DB.
import { spawn } from "node:child_process";
import { once } from "node:events";
import { randomBytes } from "node:crypto";
import { mkdtempSync, rmSync } from "node:fs";
import { join, resolve, sep } from "node:path";
import { tmpdir } from "node:os";
import { createRequire } from "node:module";
import { blogCheckConfig } from "./blog-check-config.mjs";

const require = createRequire(import.meta.url);
const temporaryRoot = resolve(tmpdir());
const directory = mkdtempSync(join(temporaryRoot, "vidya-blog-build-"));
try {
  const child = spawn(
    process.execPath,
    [require.resolve("next/dist/bin/next"), "build", "--webpack"],
    {
      stdio: "inherit",
      windowsHide: true,
      env: {
        ...process.env,
        ...blogCheckConfig(directory, ".next/blog-production-check"),
        NODE_ENV: "production",
        TURSO_DATABASE_URL: "",
        TURSO_AUTH_TOKEN: "",
        VIDYA_DATABASE_PATH: join(directory, "build.db"),
        SITE_URL: process.env.SITE_URL || "http://localhost:3000",
        SESSION_SECRET: randomBytes(32).toString("hex"),
      },
    },
  );
  const [code] = await once(child, "exit");
  process.exitCode = code ?? 1;
} finally {
  if (!resolve(directory).startsWith(`${temporaryRoot}${sep}vidya-blog-build-`))
    throw new Error("Invalid build directory.");
  rmSync(directory, { recursive: true, force: true });
}
