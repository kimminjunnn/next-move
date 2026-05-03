import { Module } from "@nestjs/common";

import { VisionClientModule } from "../vision-client/vision-client.module";
import { WallAnalysesController } from "./wall-analyses.controller";
import { WallAnalysesService } from "./wall-analyses.service";

@Module({
  imports: [VisionClientModule],
  controllers: [WallAnalysesController],
  providers: [WallAnalysesService],
})
export class WallAnalysesModule {}
