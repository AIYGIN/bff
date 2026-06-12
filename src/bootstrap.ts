import {
  type INestApplication,
  ValidationPipe,
} from "@nestjs/common";
import {
  DocumentBuilder,
  type OpenAPIObject,
  SwaggerModule,
} from "@nestjs/swagger";
import { AppConfigService } from "./common/config/app-config.service";

export const configureApp = (
  app: INestApplication,
): OpenAPIObject => {
  const appConfig = app.get(AppConfigService);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.enableCors({
    origin: appConfig.corsOrigins,
    credentials: true,
  });

  const swaggerConfig = new DocumentBuilder()
    .setTitle("BFF API")
    .setDescription("Frontend 向け BFF API")
    .setVersion("1.0")
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig, {
    autoTagControllers: false,
  });

  SwaggerModule.setup("docs", app, document, {
    jsonDocumentUrl: "docs-json",
  });

  return document;
};
