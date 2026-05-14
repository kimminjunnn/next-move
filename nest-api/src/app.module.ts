import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

import { HealthController } from "./health.controller";
import { VisionClientModule } from "./modules/vision-client/vision-client.module";
import { WallAnalysesModule } from "./modules/wall-analyses/wall-analyses.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    VisionClientModule,
    WallAnalysesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
