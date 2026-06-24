import { InternalServerErrorException } from "@nestjs/common";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { AppConfigService } from "../config/app-config.service";
import type { Database } from "./database.types";

export const SUPABASE_CLIENT = Symbol("SUPABASE_CLIENT");

export type AppSupabaseClient = SupabaseClient<Database>;

export const createSupabaseClient = (
  configService: AppConfigService,
): AppSupabaseClient => {
  const supabaseUrl = configService.supabaseUrl;
  const serviceRoleKey = configService.supabaseServiceRoleKey;
  if (!supabaseUrl || !serviceRoleKey) {
    if (configService.nodeEnv !== "production") {
      return {
        from: () => {
          throw new InternalServerErrorException("Supabase is not configured");
        },
      } as unknown as AppSupabaseClient;
    }
    throw new InternalServerErrorException("Supabase is not configured");
  }

  return createClient<Database>(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
