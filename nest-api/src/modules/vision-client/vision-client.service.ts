import {
  BadGatewayException,
  BadRequestException,
  GatewayTimeoutException,
  Injectable,
} from "@nestjs/common";
import axios, { type AxiosInstance } from "axios";

import type { DetectedWallObject } from "../wall-analyses/wall-analysis.types";

type VisionAnalyzeResponse = {
  image: {
    width: number;
    height: number;
  };
  objects: DetectedWallObject[];
};

type VisionAnalyzeInput = {
  filename: string;
  mimetype: string;
  buffer: Buffer;
};

type VisionSelectRouteResponse = {
  routeColor: { hex: string };
  includedObjectIds: string[];
};

@Injectable()
export class VisionClientService {
  private readonly client: AxiosInstance = axios.create({
    baseURL: process.env.VISION_SERVICE_URL ?? "http://localhost:8000",
    timeout: 15000,
  });

  async analyzeWall(input: VisionAnalyzeInput): Promise<VisionAnalyzeResponse> {
    const formData = new FormData();
    formData.append(
      "file",
      new Blob([new Uint8Array(input.buffer)], { type: input.mimetype }),
      input.filename,
    );

    try {
      const { data } = await this.client.post<VisionAnalyzeResponse>(
        "/internal/analyze-wall",
        formData,
      );
      return data;
    } catch (error: any) {
      if (error.response?.status === 400) {
        throw new BadRequestException("이미지를 읽지 못했어요. 다시 시도해보세요.");
      }

      if (error.response?.status === 422) {
        throw new BadRequestException(
          "벽에서 탐지된 오브젝트가 없어요. 다른 사진으로 다시 시도해보세요.",
        );
      }

      if (error.code === "ECONNABORTED") {
        throw new GatewayTimeoutException("벽 분석 시간이 초과되었습니다.");
      }

      throw new BadGatewayException("Vision service 호출에 실패했습니다.");
    }
  }

  async selectRoute(input: {
    analysisId: string;
    startHoldObjectId: string;
    objects: DetectedWallObject[];
  }): Promise<VisionSelectRouteResponse> {
    try {
      const { data } = await this.client.post<VisionSelectRouteResponse>(
        "/internal/select-route",
        input,
      );
      return data;
    } catch (error: any) {
      if (error.response?.status === 422) {
        throw new BadRequestException("스타트 홀드를 다시 선택해주세요.");
      }

      if (error.code === "ECONNABORTED") {
        throw new GatewayTimeoutException("루트 분석 시간이 초과되었습니다.");
      }

      throw new BadGatewayException("Vision service 호출에 실패했습니다.");
    }
  }
}
