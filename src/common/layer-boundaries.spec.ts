import {
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { basename, extname, resolve } from "node:path";
import { Test } from "@nestjs/testing";
import { AppModule } from "../app.module";
import { configureApp } from "../bootstrap";

const root = process.cwd();
const source = (path: string): string =>
  readFileSync(resolve(root, path), "utf8");

const filesBelow = (directory: string): string[] =>
  readdirSync(resolve(root, directory)).flatMap((entry) => {
    const path = `${directory}/${entry}`;
    return statSync(resolve(root, path)).isDirectory()
      ? filesBelow(path)
      : [path];
  });

const typescriptFiles = (directory: string, suffix: string): string[] =>
  filesBelow(directory).filter(
    (path) => path.endsWith(suffix) && !path.endsWith(".spec.ts"),
  );

describe("layer boundaries", () => {
  it("keeps each Controller dependent on only its matching Service", () => {
    for (const path of typescriptFiles(
      "src/controller",
      ".controller.ts",
    )) {
      const contents = source(path);
      const controllerName = basename(path, ".controller.ts");
      const serviceName = `${controllerName[0].toUpperCase()}${controllerName.slice(1)}Service`;
      const constructorParameters = contents.match(
        /constructor\s*\(([\s\S]*?)\)\s*\{/,
      )?.[1];

      expect(path).not.toMatch(/src\/(?:provider|module)\//);
      expect(contents).not.toMatch(
        /(?:resource\/|entity\/|@nestjs\/axios|\bHttpService\b)/,
      );
      expect(contents).not.toMatch(/helper\.service|utility.*service/i);
      expect(constructorParameters).toBeDefined();
      expect(constructorParameters).toMatch(
        new RegExp(
          `^\\s*private readonly ${controllerName}Service: ${serviceName},?\\s*$`,
        ),
      );
      expect(
        [...contents.matchAll(/from ["'].*\/service\/.*["']/g)],
      ).toHaveLength(1);
    }
  });

  it("keeps HTTP clients and Swagger decorators out of Services", () => {
    for (const path of typescriptFiles("src/service", ".service.ts")) {
      const contents = source(path);

      expect(contents).not.toMatch(
        /@nestjs\/axios|@nestjs\/swagger|\bHttpService\b/,
      );
    }
  });

  it("keeps DTO, Controller, Service, and Swagger dependencies out of Resources", () => {
    for (const path of typescriptFiles(
      "src/resource",
      ".resource.ts",
    )) {
      const contents = source(path);

      expect(contents).not.toMatch(
        /(?:\/dto\/|\/controller\/|\/service\/|@nestjs\/swagger)/,
      );
    }
  });

  it("keeps Swagger decorators out of Entities", () => {
    for (const path of typescriptFiles("src/entity", ".ts")) {
      expect(source(path)).not.toMatch(
        /@nestjs\/swagger|ApiProperty|ApiExtraModels/,
      );
    }
  });

  it("keeps Utilities free of NestJS dependencies", () => {
    for (const path of typescriptFiles("src/utility", ".ts")) {
      expect(source(path)).not.toMatch(/from ["']@nestjs\//);
    }
  });

  it("keeps Resource, Entity, HTTP, and Swagger dependencies out of Guards", () => {
    for (const path of typescriptFiles("src/guard", ".ts")) {
      expect(source(path)).not.toMatch(
        /(?:\/resource\/|\/entity\/|@nestjs\/axios|@nestjs\/swagger|\bHttpService\b)/,
      );
    }
  });

  it("does not introduce provider or module directories", () => {
    const directories = filesBelow("src")
      .map((path) => path.split("/").slice(0, -1).join("/"))
      .filter((path, index, paths) => paths.indexOf(path) === index);

    expect(directories).not.toContain("src/provider");
    expect(directories).not.toContain("src/module");
  });

  it("does not publish Entity classes in OpenAPI", async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    const app = moduleRef.createNestApplication();

    try {
      const document = configureApp(app);
      const schemas = Object.keys(document.components?.schemas ?? {});

      expect(schemas.some((schema) => schema.includes("Entity"))).toBe(false);
    } finally {
      await app.close();
    }
  });

  it("documents the enforced layer boundaries for Codex agents", () => {
    const paths = [
      "AGENTS.md",
      "docs/bff-code-design-rules.md",
      "docs/swagger-openapi-rules.md",
      "docs/ai-api-harness.md",
      ".codex/agents/implementation_implementer.toml",
      ".codex/agents/implementation_reviewer.toml",
      ".codex/agents/implementation_tester.toml",
      ".codex/workflows/api_implementation_flow.md",
    ];
    const requiredRules = [
      /Controller.*Service.*1対1/s,
      /対応する Service だけを inject/s,
      /src\/provider\//,
      /src\/module\//,
      /Resource.*Entity を返/s,
      /Service.*Entity.*DTO/s,
      /Entity.*Swagger\/OpenAPI.*公開しない/s,
      /DI 不要.*utility/is,
    ];

    for (const path of paths) {
      expect(extname(path)).not.toBe("");
      const contents = source(path);
      for (const rule of requiredRules) {
        expect(contents).toMatch(rule);
      }
    }
  });
});
