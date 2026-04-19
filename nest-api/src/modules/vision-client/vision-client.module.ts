import { Module } from "@nestjs/common";

import { VisionClientService } from "./vision-client.service";

@Module({
  providers: [VisionClientService],
  exports: [VisionClientService],
})
export class VisionClientModule {}
