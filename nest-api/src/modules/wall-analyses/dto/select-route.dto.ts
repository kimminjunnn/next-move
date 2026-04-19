import { IsString } from "class-validator";

export class SelectRouteDto {
  @IsString()
  startHoldObjectId!: string;
}
