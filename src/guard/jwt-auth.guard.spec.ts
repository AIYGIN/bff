import { type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../service/auth/auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";

describe("JwtAuthGuard", () => {
  const contextFor = (request: Partial<Request>) =>
    ({
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    }) as ExecutionContext;

  it("sets CurrentUser from a valid access Cookie", async () => {
    const authService = {
      verifyAccessToken: jest.fn().mockResolvedValue({
        subject: "usr_v1_opaque",
        displayName: "Sample User",
      }),
    } as unknown as jest.Mocked<AuthService>;
    const guard = new JwtAuthGuard(authService);
    const request = {
      headers: { cookie: "other=value; access_token=valid-jwt" },
    };

    await expect(
      guard.canActivate(contextFor(request)),
    ).resolves.toBe(true);
    expect(authService.verifyAccessToken).toHaveBeenCalledWith(
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
    const authService = {
      verifyAccessToken: jest.fn(),
    } as unknown as AuthService;
    const guard = new JwtAuthGuard(authService);

    await expect(
      guard.canActivate(contextFor(request)),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("maps token verification failures to a generic 401", async () => {
    const authService = {
      verifyAccessToken: jest.fn().mockRejectedValue(new Error("details")),
    } as unknown as AuthService;
    const guard = new JwtAuthGuard(authService);

    await expect(
      guard.canActivate(
        contextFor({ headers: { cookie: "access_token=invalid" } }),
      ),
    ).rejects.toEqual(new UnauthorizedException("Unauthorized"));
  });
});
