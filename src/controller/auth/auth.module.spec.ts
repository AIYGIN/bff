import { HttpService } from "@nestjs/axios";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../app.module";
import { JwtAuthGuard } from "../../guard/jwt-auth.guard";
import { GoogleOAuthResource } from "../../resource/auth/google-oauth.resource";
import { AuthService } from "../../service/auth/auth.service";
import { AuthModule } from "./auth.module";

describe("AuthModule", () => {
  it("resolves Auth providers and allows the external HTTP client to be replaced", async () => {
    const httpService = {
      get: jest.fn(),
      post: jest.fn(),
    };
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(HttpService)
      .useValue(httpService)
      .compile();
    const authModule = moduleRef.select(AuthModule);

    expect(authModule.get(AuthService, { strict: true })).toBeDefined();
    expect(authModule.get(GoogleOAuthResource, { strict: true })).toBeDefined();
    expect(authModule.get(JwtAuthGuard, { strict: true })).toBeDefined();
    expect(moduleRef.get(HttpService)).toBe(httpService);

    await moduleRef.close();
  });
});
