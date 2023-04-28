import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { initApp } from './initApp';
import { swaggerConfig } from './config/swagger.config';
import { mainConfig } from './config/main.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  initApp(app);

  const swaggerConfig = configService.get<swaggerConfig>('swagger');
  const swaggerBuilderConfig = new DocumentBuilder()
    .setTitle(swaggerConfig.title)
    .setDescription(swaggerConfig.description)
    .setVersion(swaggerConfig.version)
    .build();
  const document = SwaggerModule.createDocument(app, swaggerBuilderConfig);
  SwaggerModule.setup(swaggerConfig.swaggerPath, app, document);
  console.info('[Swagger] Initied');

  await app.listen(configService.get('port'));

  const apiUrl = configService.get<mainConfig['apiUrl']>('apiUrl');
  console.info(`[  API  ] ${apiUrl}`);
  console.info(`[Swagger] ${apiUrl}/${swaggerConfig.swaggerPath}`);
}
bootstrap();
