import { type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { JwtTokenService } from "../../services/auth/jwt-token.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  const contextFor = (request: Partial<Request>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  it("sets CurrentUser from a valid access Cookie", async () => {
    const jwtTokenService = {
      verifyAccessToken: jest.fn().mockResolvedValue({
        subject: "usr_v1_opaque",
        displayName: "Sample User",
      }),
    } as unknown as jest.Mocked<JwtTokenService>;
    const guard = new JwtAuthGuard(jwtTokenService);
    const request = {
      headers: { cookie: "other=value; access_token=valid-jwt" },
    };

    await expect(
      guard.canActivate(contextFor(request)),
    ).resolves.toBe(true);
    expect(jwtTokenService.verifyAccessToken).toHaveBeenCalledWith(
      "valid-jwt",
    );
    expect(request).toHaveProperty("currentUser", {
      subject: "usr_v1_opaque",
      displayName: "Sample User",
    });
  });

  it.each([
    ["missing Cookie", {}],
    ["empty Cookie", { headers: { cookie: "access_token=" } }],
    [
      "Authorization bearer only",
      { headers: { authorization: "Bearer valid-jwt" } },
    ],
  ])("returns generic 401 for %s", async (_name, request) => {
    const jwtTokenService = {
      verifyAccessToken: jest.fn(),
    } as unknown as JwtTokenService;
    const guard = new JwtAuthGuard(jwtTokenService);

    await expect(
      guard.canActivate(contextFor(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
