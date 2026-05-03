import { IsIn, IsOptional, IsString } from "class-validator";

export class CreateWallAnalysisDto {
  @IsOptional()
  @IsString()
  @IsIn(["camera", "library"])
  source?: "camera" | "library";
}
