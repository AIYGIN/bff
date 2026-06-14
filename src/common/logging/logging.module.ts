import { Global, Module } from "@nestjs/common";
import { LoggerModule } from "nestjs-pino";
import { AppConfigModule } from "../config/app-config.module";
import { AppConfigService } from "../config/app-config.service";
import { AppLogger } from "./app-logger.service";
import { createHttpLoggerOptions } from "./http-logging";

export const LOG_STREAM = Symbol("LOG_STREAM");

@Global()
@Module({
  providers: [
    {
      provide: LOG_STREAM,
      useValue: process.stdout,
    },
  ],
  exports: [LOG_STREAM],
})
export class LogDestinationModule {}

@Global()
@Module({
  imports: [
    AppConfigModule,
    LogDestinationModule,
    LoggerModule.forRootAsync({
      imports: [AppConfigModule, LogDestinationModule],
      inject: [AppConfigService, LOG_STREAM],
      useFactory: (
        config: AppConfigService,
        stream: NodeJS.WritableStream,
      ) => ({
        pinoHttp: [createHttpLoggerOptions(config.logLevel), stream],
      }),
    }),
  ],
  providers: [AppLogger],
  exports: [AppLogger],
})
export class LoggingModule {}
