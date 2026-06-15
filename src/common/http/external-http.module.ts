import { HttpModule } from "@nestjs/axios";
import { Module } from "@nestjs/common";

@Module({
  imports: [
    HttpModule.register({
      timeout: 5_000,
      maxRedirects: 5,
    }),
  ],
  exports: [HttpModule],
})
export class ExternalHttpModule {}
