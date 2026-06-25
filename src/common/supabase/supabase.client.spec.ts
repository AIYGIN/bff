import { createClient } from "@supabase/supabase-js";
import type { AppConfigService } from "../config/app-config.service";
import { createSupabaseClient } from "./supabase.client";

jest.mock("@supabase/supabase-js", () => ({
  createClient: jest.fn(() => ({ from: jest.fn() })),
}));

describe("createSupabaseClient", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a server-side Supabase client with session persistence disabled", () => {
    const client = createSupabaseClient({
      supabaseUrl: "https://project.supabase.co/",
      supabaseServiceRoleKey: "service-role-key",
    } as AppConfigService);

    expect(client).toEqual({ from: expect.any(Function) });
    expect(createClient).toHaveBeenCalledTimes(1);
    expect(createClient).toHaveBeenCalledWith(
      "https://project.supabase.co/",
      "service-role-key",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    );
  });

  it("creates a non-production stub when Supabase env is missing", () => {
    const client = createSupabaseClient({
      supabaseUrl: null,
      supabaseServiceRoleKey: null,
      nodeEnv: "test",
    } as AppConfigService);

    expect(createClient).not.toHaveBeenCalled();
    expect(() => client.from("todos")).toThrow("Supabase is not configured");
  });

  it("fails when Supabase env is missing in production", () => {
    expect(() =>
      createSupabaseClient({
        supabaseUrl: null,
        supabaseServiceRoleKey: null,
        nodeEnv: "production",
      } as AppConfigService),
    ).toThrow("Supabase is not configured");
  });
});
