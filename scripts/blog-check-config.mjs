import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

export function blogCheckConfig(directory, distDir) {
  const root = process.cwd();
  const config = JSON.parse(readFileSync(join(root, "tsconfig.json"), "utf8"));
  const absolute = (path) => resolve(root, path).replaceAll("\\", "/");
  // Keep @/* relative to the application root, not this generated config.
  // Webpack's paths plugin expects relative path targets with a baseUrl.
  config.compilerOptions.baseUrl = root;
  config.compilerOptions.tsBuildInfoFile = join(directory, "check.tsbuildinfo");
  config.include = [
    absolute("next-env.d.ts"),
    absolute("next.config.ts"),
    ...["app", "components", "lib", "tests", "scripts"].flatMap((path) => [
      absolute(`${path}/**/*.ts`),
      absolute(`${path}/**/*.tsx`),
      absolute(`${path}/**/*.mts`),
    ]),
    absolute(`${distDir}/types/**/*.ts`),
    absolute(`${distDir}/dev/types/**/*.ts`),
  ];
  config.exclude = [absolute("node_modules")];
  // Next joins tsconfigPath to the project directory, so use a project-relative
  // path (absolute Windows paths otherwise get prefixed with the project path).
  mkdirSync(join(root, ".next"), { recursive: true });
  const path = join(".next", `${basename(distDir)}.tsconfig.check.json`);
  writeFileSync(path, JSON.stringify(config, null, 2));
  return { VIDYA_CHECK_DIST_DIR: distDir, VIDYA_CHECK_TSCONFIG: path };
}
