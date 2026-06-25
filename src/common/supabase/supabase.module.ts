import { Module } from "@nestjs/common";
import { AppConfigService } from "../config/app-config.service";
import { createSupabaseClient, SUPABASE_CLIENT } from "./supabase.client";

@Module({
  providers: [
    {
      provide: SUPABASE_CLIENT,
      inject: [AppConfigService],
      useFactory: createSupabaseClient,
    },
  ],
  exports: [SUPABASE_CLIENT],
})
export class SupabaseModule {}
