import { type ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { ROUTE_ARGS_METADATA } from "@nestjs/common/constants";
import type { CurrentUser as CurrentUserValue } from "./current-user";
import { CurrentUser } from "./current-user.decorator";

class TestController {
  handler(@CurrentUser() currentUser: CurrentUserValue): CurrentUserValue {
    return currentUser;
  }
}

interface ParameterMetadata {
  factory: (data: unknown, context: ExecutionContext) => CurrentUserValue;
}

describe("CurrentUser", () => {
  const factory = (): ParameterMetadata["factory"] => {
    const metadata = Reflect.getMetadata(
      ROUTE_ARGS_METADATA,
      TestController,
      "handler",
    ) as Record<string, ParameterMetadata>;

    return Object.values(metadata)[0].factory;
  };

  const contextFor = (currentUser?: CurrentUserValue) =>
    ({
      switchToHttp: () => ({
        getRequest: () => ({ currentUser }),
      }),
    }) as ExecutionContext;

  it("returns the internal principal set by JwtAuthGuard", () => {
    const currentUser = {
      subject: `usr_v1_${"A".repeat(43)}`,
      displayName: "Sample User",
    };

    expect(factory()(undefined, contextFor(currentUser))).toBe(currentUser);
  });

  it("returns generic 401 when no principal was set", () => {
    expect(() => factory()(undefined, contextFor())).toThrow(
      UnauthorizedException,
    );
  });
});
