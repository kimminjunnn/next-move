import {
  Body,
  Controller,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import multer from "multer";

import { CreateWallAnalysisDto } from "./dto/create-wall-analysis.dto";
import { SelectRouteDto } from "./dto/select-route.dto";
import {
  WALL_PHOTO_MAX_BYTES,
  wallPhotoFileFilter,
} from "./wall-upload-options";
import { WallAnalysesService } from "./wall-analyses.service";

@Controller("/api/v1/wall-analyses")
export class WallAnalysesController {
  constructor(private readonly wallAnalysesService: WallAnalysesService) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("file", {
      fileFilter: wallPhotoFileFilter,
      limits: {
        fileSize: WALL_PHOTO_MAX_BYTES,
      },
      storage: multer.memoryStorage(),
    }),
  )
  async createWallAnalysis(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() dto: CreateWallAnalysisDto,
  ) {
    return this.wallAnalysesService.createWallAnalysis(file, dto);
  }

  @Post(":analysisId/route")
  async selectRoute(
    @Param("analysisId") analysisId: string,
    @Body() dto: SelectRouteDto,
  ) {
    return this.wallAnalysesService.selectRoute(analysisId, dto);
  }
}
