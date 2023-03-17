import { NestFactory } from '@nestjs/core';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { initBootstrap } from './initBoostrap';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  initBootstrap(app);

  const swaggerConfig = new DocumentBuilder()
    .setTitle(configService.get('swagger.title'))
    .setDescription(configService.get('swagger.description'))
    .setVersion(configService.get('swagger.version'))
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup(configService.get('swagger.swaggerPath'), app, document);

  await app.listen(configService.get('port'));
}
bootstrap();
