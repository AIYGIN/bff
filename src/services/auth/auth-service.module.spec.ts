import { HttpService } from "@nestjs/axios";
import { Test } from "@nestjs/testing";
import { AppModule } from "../../app.module";
import { JwtAuthGuard } from "../../common/auth/jwt-auth.guard";
import { GoogleOAuthResource } from "../../resources/auth/google-oauth.resource";
import { AuthCookieService } from "./auth-cookie.service";
import { AuthServiceModule } from "./auth-service.module";
import { AuthService } from "./auth.service";
import { JwtTokenService } from "./jwt-token.service";
import { OAuthStateService } from "./oauth-state.service";
import { OpaqueSubjectService } from "./opaque-subject.service";

describe("AuthServiceModule", () => {
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
    const authModule = moduleRef.select(AuthServiceModule);

    expect(authModule.get(AuthService, { strict: true })).toBeDefined();
    expect(authModule.get(AuthCookieService, { strict: true })).toBeDefined();
    expect(authModule.get(GoogleOAuthResource, { strict: true })).toBeDefined();
    expect(authModule.get(OAuthStateService, { strict: true })).toBeDefined();
    expect(
      authModule.get(OpaqueSubjectService, { strict: true }),
    ).toBeDefined();
    expect(authModule.get(JwtTokenService, { strict: true })).toBeDefined();
    expect(authModule.get(JwtAuthGuard, { strict: true })).toBeDefined();
    expect(moduleRef.get(HttpService)).toBe(httpService);

    await moduleRef.close();
  });
});
