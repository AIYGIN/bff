import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { EnterprisesService } from "../../service/enterprises/enterprises.service";
import { EnterprisesController } from "./enterprises.controller";

@Module({
  imports: [AuthModule],
  controllers: [EnterprisesController],
  providers: [EnterprisesService],
})
export class EnterprisesModule {}
