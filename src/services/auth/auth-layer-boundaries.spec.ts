import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const source = (path: string): string =>
  readFileSync(resolve(process.cwd(), path), "utf8");

describe("Auth layer boundaries", () => {
  it("keeps Resource and Entity dependencies out of the Controller", () => {
    const controller = source("src/controller/auth/auth.controller.ts");

    expect(controller).not.toMatch(/resources\//);
    expect(controller).not.toMatch(/interface\/entity\//);
    expect(controller).not.toMatch(/@nestjs\/axios/);
    expect(controller).not.toMatch(/\bHttpService\b/);
  });

  it("keeps HTTP and Swagger dependencies out of the Service", () => {
    const service = source("src/services/auth/auth.service.ts");

    expect(service).not.toMatch(/@nestjs\/axios/);
    expect(service).not.toMatch(/@nestjs\/swagger/);
    expect(service).not.toMatch(/\bHttpService\b/);
  });

  it("keeps DTO, Controller, Service, and Swagger dependencies out of the Resource", () => {
    const resource = source("src/resources/auth/google-oauth.resource.ts");

    expect(resource).not.toMatch(/interface\/dto\//);
    expect(resource).not.toMatch(/controller\//);
    expect(resource).not.toMatch(/services\//);
    expect(resource).not.toMatch(/@nestjs\/swagger/);
  });

  it("keeps Swagger decorators out of internal Auth types", () => {
    const entity = source("src/interface/entity/auth/google-oauth.entity.ts");
    const currentUser = source("src/common/auth/current-user.ts");

    expect(entity).not.toMatch(/@nestjs\/swagger|ApiProperty/);
    expect(currentUser).not.toMatch(/@nestjs\/swagger|ApiProperty/);
  });
});
