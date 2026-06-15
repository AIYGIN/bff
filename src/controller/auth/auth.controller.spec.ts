import type { Request, Response } from "express";
import { AuthService } from "../../service/auth/auth.service";
import { AuthController } from "./auth.controller";

describe("AuthController", () => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
  } as const;

  const createResponse = () =>
    ({
      clearCookie: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
    }) as unknown as Response;

  const createController = () => {
    const authService = {
      accessTokenCookieOptions: jest.fn().mockReturnValue({
        ...cookieOptions,
        maxAge: 3_600_000,
      }),
      beginGoogleLogin: jest.fn(),
      cookieClearOptions: jest.fn().mockReturnValue(cookieOptions),
      getMe: jest.fn(),
      handleGoogleCallback: jest.fn(),
      oauthStateCookieOptions: jest.fn().mockReturnValue({
        ...cookieOptions,
        maxAge: 600_000,
      }),
    } as unknown as jest.Mocked<AuthService>;

    return {
      authService,
      controller: new AuthController(authService),
    };
  };

  it("delegates login and sets the dynamic state Cookie", async () => {
    const { authService, controller } = createController();
    authService.beginGoogleLogin.mockResolvedValue({
      authorizationUrl: "https://accounts.google.com/auth?state=random",
      stateCookieValue: "signed-state",
    });
    const response = createResponse();

    await controller.googleLogin(response);

    expect(authService.beginGoogleLogin).toHaveBeenCalledTimes(1);
    expect(response.cookie).toHaveBeenCalledWith(
      "google_oauth_state",
      "signed-state",
      expect.objectContaining({ maxAge: 600_000 }),
    );
    expect(response.redirect).toHaveBeenCalledWith(
      "https://accounts.google.com/auth?state=random",
    );
  });

  it("passes callback query and state Cookie to the service", async () => {
    const { authService, controller } = createController();
    authService.handleGoogleCallback.mockResolvedValue({
      kind: "success",
      accessToken: "bff-jwt",
      redirectUrl: "https://frontend.example.com/auth/success",
    });
    const request = {
      headers: { cookie: "google_oauth_state=signed-state" },
    } as Request;
    const response = createResponse();

    await controller.googleCallback(
      { code: "code", state: "state" },
      request,
      response,
    );

    expect(authService.handleGoogleCallback).toHaveBeenCalledWith({
      code: "code",
      cookieHeader: "google_oauth_state=signed-state",
      error: undefined,
      state: "state",
    });
    expect(response.cookie).toHaveBeenCalledWith(
      "access_token",
      "bff-jwt",
      expect.objectContaining({ maxAge: 3_600_000 }),
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      "google_oauth_state",
      cookieOptions,
    );
    expect(response.redirect).toHaveBeenCalledWith(
      "https://frontend.example.com/auth/success",
    );
  });

  it("does not set access Cookie for a failure result", async () => {
    const { authService, controller } = createController();
    authService.handleGoogleCallback.mockResolvedValue({
      kind: "failure",
      redirectUrl: "https://frontend.example.com/auth/failure",
    });
    const response = createResponse();

    await controller.googleCallback(
      { error: "access_denied", state: "state" },
      { headers: { cookie: "google_oauth_state=signed" } } as Request,
      response,
    );

    expect(response.cookie).not.toHaveBeenCalled();
    expect(response.clearCookie).toHaveBeenCalledWith(
      "google_oauth_state",
      cookieOptions,
    );
    expect(response.redirect).toHaveBeenCalledWith(
      "https://frontend.example.com/auth/failure",
    );
  });

  it("clears state Cookie when callback service throws", async () => {
    const { authService, controller } = createController();
    authService.handleGoogleCallback.mockRejectedValue(
      new Error("invalid state"),
    );
    const response = createResponse();

    await expect(
      controller.googleCallback(
        { code: "code", state: "state" },
        { headers: {} } as Request,
        response,
      ),
    ).rejects.toThrow("invalid state");
    expect(response.clearCookie).toHaveBeenCalledWith(
      "google_oauth_state",
      cookieOptions,
    );
  });

  it("passes CurrentUser to the service and returns its DTO", () => {
    const { authService, controller } = createController();
    const currentUser = {
      subject: "usr_v1_opaque",
      displayName: "Sample User",
    };
    authService.getMe.mockReturnValue({
      displayName: "Sample User",
    });

    expect(controller.getMe(currentUser)).toEqual({
      displayName: "Sample User",
    });
    expect(authService.getMe).toHaveBeenCalledWith(currentUser);
  });

  it("clears the access Cookie when logging out", () => {
    const { authService, controller } = createController();
    const response = createResponse();

    expect(controller.logout(response)).toBeUndefined();
    expect(response.clearCookie).toHaveBeenCalledWith(
      "access_token",
      cookieOptions,
    );
    expect(authService.beginGoogleLogin).not.toHaveBeenCalled();
    expect(authService.handleGoogleCallback).not.toHaveBeenCalled();
    expect(authService.getMe).not.toHaveBeenCalled();
    expect(authService.cookieClearOptions).toHaveBeenCalledTimes(1);
  });
});
