import { BadRequestException } from "@nestjs/common";
import type { Response } from "express";
import { AuthController } from "./auth.controller";

describe("AuthController", () => {
  const cookieOptions = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: false,
  } as const;

  const createResponse = () => {
    const response = {
      clearCookie: jest.fn(),
      cookie: jest.fn(),
      redirect: jest.fn(),
    };

    return response as unknown as Response;
  };

  it("sets the OAuth Cookie and redirects to the fixed Google URL", () => {
    const controller = new AuthController();
    const response = createResponse();

    controller.googleLogin(response);

    expect(response.cookie).toHaveBeenCalledWith(
      "google_oauth_state",
      "mock-signed-oauth-state-pkce",
      cookieOptions,
    );
    expect(response.redirect).toHaveBeenCalledWith(
      "https://accounts.google.com/o/oauth2/v2/auth?client_id=mock-google-client-id&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fauth%2Fgoogle%2Fcallback&response_type=code&scope=openid%20profile%20email&state=mock-oauth-state&code_challenge=mock-code-challenge&code_challenge_method=S256",
    );
  });

  it("sets Secure on OAuth Cookie in production", () => {
    const originalNodeEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = "production";

    try {
      const controller = new AuthController();
      const response = createResponse();

      controller.googleLogin(response);

      expect(response.cookie).toHaveBeenCalledWith(
        "google_oauth_state",
        "mock-signed-oauth-state-pkce",
        {
          ...cookieOptions,
          secure: true,
        },
      );
    } finally {
      process.env.NODE_ENV = originalNodeEnv;
    }
  });

  it("sets the access Cookie, clears OAuth state, and redirects on success", () => {
    const controller = new AuthController();
    const response = createResponse();

    controller.googleCallback(
      { code: "mock-code", state: "mock-oauth-state" },
      response,
    );

    expect(response.cookie).toHaveBeenCalledWith(
      "access_token",
      "mock-bff-access-token",
      cookieOptions,
    );
    expect(response.clearCookie).toHaveBeenCalledWith(
      "google_oauth_state",
      cookieOptions,
    );
    expect(response.redirect).toHaveBeenCalledWith(
      "http://localhost:3000/auth/success",
    );
  });

  it("clears OAuth state and redirects without exposing Provider error", () => {
    const controller = new AuthController();
    const response = createResponse();

    controller.googleCallback(
      { error: "access_denied", state: "mock-oauth-state" },
      response,
    );

    expect(response.cookie).not.toHaveBeenCalled();
    expect(response.clearCookie).toHaveBeenCalledWith(
      "google_oauth_state",
      cookieOptions,
    );
    expect(response.redirect).toHaveBeenCalledWith(
      "http://localhost:3000/auth/failure",
    );
  });

  it.each([
    ["missing state", { code: "mock-code" }],
    [
      "code and error together",
      {
        code: "mock-code",
        error: "access_denied",
        state: "mock-oauth-state",
      },
    ],
    ["neither code nor error", { state: "mock-oauth-state" }],
  ])("rejects callback query with %s", (_name, query) => {
    const controller = new AuthController();
    const response = createResponse();

    expect(() => controller.googleCallback(query, response)).toThrow(
      BadRequestException,
    );
    expect(response.cookie).not.toHaveBeenCalled();
    expect(response.clearCookie).not.toHaveBeenCalled();
    expect(response.redirect).not.toHaveBeenCalled();
  });

  it("returns display-only user data without email or identifiers", () => {
    const controller = new AuthController();

    expect(controller.getMe()).toEqual({
      displayName: "Sample User",
      profileImageUrl: "https://example.com/profile.jpg",
    });
    expect(controller.getMe()).not.toHaveProperty("email");
    expect(controller.getMe()).not.toHaveProperty("subject");
  });

  it("clears the access Cookie when logging out", () => {
    const controller = new AuthController();
    const response = createResponse();

    expect(controller.logout(response)).toBeUndefined();
    expect(response.clearCookie).toHaveBeenCalledWith(
      "access_token",
      cookieOptions,
    );
  });
});
