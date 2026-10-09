// Compile the focused TypeScript tests with the existing compiler, then use
// Node's built-in test runner. No extra runner or shared database is needed.
import ts from "typescript";
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
} from "node:fs";
import { dirname, join, resolve, sep } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const outputRoot = resolve(root, ".next");
mkdirSync(outputRoot, { recursive: true });
const output = mkdtempSync(join(outputRoot, "blog-tests-"));
const files = [
  "lib/db/index.ts",
  "lib/blog/content.ts",
  "lib/blog/types.ts",
  "lib/blog/repository.ts",
  "lib/blog/images.ts",
  "lib/blog/forms.ts",
  "lib/blog/seo.ts",
  "lib/validations/blog.ts",
  "tests/blog.test.ts",
];
const paths = new Set(files.map((file) => resolve(root, file)));
try {
  for (const file of files) {
    const sourcePath = resolve(root, file);
    const transformed = ts.transpileModule(readFileSync(sourcePath, "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.ESNext,
        target: ts.ScriptTarget.ES2022,
      },
      transformers: {
        before: [
          (context) => {
            const visit = (node) => {
              if (
                ts.isImportDeclaration(node) &&
                ts.isStringLiteral(node.moduleSpecifier) &&
                node.moduleSpecifier.text.startsWith(".")
              ) {
                const specifier = node.moduleSpecifier.text;
                const target = resolve(dirname(sourcePath), specifier);
                const suffix = paths.has(`${target}.ts`)
                  ? ".mjs"
                  : "/index.mjs";
                return context.factory.updateImportDeclaration(
                  node,
                  node.modifiers,
                  node.importClause,
                  context.factory.createStringLiteral(`${specifier}${suffix}`),
                  node.attributes,
                );
              }
              return ts.visitEachChild(node, visit, context);
            };
            return (source) => ts.visitNode(source, visit);
          },
        ],
      },
    }).outputText;
    const destination = join(output, file.replace(/\.ts$/, ".mjs"));
    mkdirSync(dirname(destination), { recursive: true });
    writeFileSync(
      destination,
      file === "lib/db/index.ts"
        ? `import { createRequire } from 'node:module'; const require = createRequire(import.meta.url);\n${transformed}`
        : transformed,
    );
  }
  const result = spawnSync(
    process.execPath,
    ["--test", join(output, "tests/blog.test.mjs")],
    {
      stdio: "inherit",
      env: {
        ...process.env,
        NODE_ENV: "test",
        TURSO_DATABASE_URL: "",
        TURSO_AUTH_TOKEN: "",
        VIDYA_DATABASE_PATH: join(output, "isolated.db"),
        SITE_URL: "https://vidya.example",
      },
    },
  );
  process.exitCode = result.status ?? 1;
} finally {
  if (!resolve(output).startsWith(`${outputRoot}${sep}`))
    throw new Error("Invalid test output path.");
  rmSync(output, { recursive: true, force: true });
}
