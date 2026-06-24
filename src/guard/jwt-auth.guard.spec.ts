import { UnauthorizedException } from "@nestjs/common";

import { type AuthenticatedRequest, JwtAuthGuard } from "./jwt-auth.guard";
import type { AuthService } from "../service/auth/auth.service";

describe("JwtAuthGuard", () => {
  it("rejects requests without an access token cookie", async () => {
    const authService = {
      verifyAccessToken: jest.fn(),
    } as unknown as AuthService;
    const guard = new JwtAuthGuard(authService);
    const request = { headers: {} };

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as never),
    ).rejects.toThrow(UnauthorizedException);
  });

  it("attaches the verified user to the request", async () => {
    const currentUser = { subject: "33333333-3333-3333-3333-333333333333" };
    const authService = {
      verifyAccessToken: jest.fn(async () => currentUser),
    } as unknown as AuthService;
    const guard = new JwtAuthGuard(authService);
    const request = {
      headers: { cookie: "access_token=fake-token" },
    } as AuthenticatedRequest;

    await expect(
      guard.canActivate({
        switchToHttp: () => ({
          getRequest: () => request,
        }),
      } as never),
    ).resolves.toBe(true);

    expect(authService.verifyAccessToken).toHaveBeenCalledWith("fake-token");
    expect(request.currentUser).toEqual(currentUser);
  });
});
