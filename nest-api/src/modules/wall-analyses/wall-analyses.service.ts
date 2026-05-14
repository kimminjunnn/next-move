import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { randomUUID } from "node:crypto";

import { VisionClientService } from "../vision-client/vision-client.service";
import { CreateWallAnalysisDto } from "./dto/create-wall-analysis.dto";
import { SelectRouteDto } from "./dto/select-route.dto";
import type {
  RouteSelectionResponse,
  WallAnalysisResponse,
} from "./wall-analysis.types";

@Injectable()
export class WallAnalysesService {
  private readonly analyses = new Map<string, WallAnalysisResponse>();

  constructor(private readonly visionClient: VisionClientService) {}

  async createWallAnalysis(
    file: Express.Multer.File | undefined,
    _dto: CreateWallAnalysisDto,
  ) {
    if (!file) {
      throw new BadRequestException("이미지 파일이 필요합니다.");
    }

    const result = await this.visionClient.analyzeWall({
      filename: file.originalname,
      mimetype: file.mimetype,
      buffer: file.buffer,
    });
    const analysis: WallAnalysisResponse = {
      id: `an_${randomUUID()}`,
      image: result.image,
      objects: result.objects,
    };

    this.analyses.set(analysis.id, analysis);

    return { analysis };
  }

  async selectRoute(analysisId: string, dto: SelectRouteDto) {
    const analysis = this.analyses.get(analysisId);

    if (!analysis) {
      throw new NotFoundException("분석 결과를 찾을 수 없습니다.");
    }

    const startObject = analysis.objects.find(
      (object) => object.id === dto.startHoldObjectId,
    );

    if (!startObject || startObject.kind !== "hold") {
      throw new BadRequestException("스타트 홀드는 hold 오브젝트여야 합니다.");
    }

    const result = await this.visionClient.selectRoute({
      analysisId,
      startHoldObjectId: dto.startHoldObjectId,
      objects: analysis.objects,
    });

    const route: RouteSelectionResponse = {
      analysisId,
      startHoldObjectId: dto.startHoldObjectId,
      routeColor: result.routeColor,
      includedObjectIds: result.includedObjectIds,
    };

    return { route };
  }
}
