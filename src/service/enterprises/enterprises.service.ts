import { Injectable } from "@nestjs/common";

import { GetEnterpriseQuantsInfoResponseDto } from "../../dto/enterprises/get-enterprise-quants-info-response.dto";
import { JQuantsEnterpriseQuantsInfoMockResource } from "../../resource/enterprises/j-quants-enterprise-quants-info-mock.resource";

const UPDATED_AT = "2026-06-26T00:00:00.000Z";
const DATA_AS_OF_DATE = "2026-06-26";
const DISCLAIMER =
  "本画面は配当持続性を分析するためのものであり、特定銘柄の売買を推奨するものではありません。";

@Injectable()
export class EnterprisesService {
  constructor(
    private readonly quantsInfoResource: JQuantsEnterpriseQuantsInfoMockResource,
  ) {}

  getQuantsInfo(): GetEnterpriseQuantsInfoResponseDto {
    return new GetEnterpriseQuantsInfoResponseDto({
      enterprises: this.quantsInfoResource.findManyFromJQuantsApiMock(),
      updatedAt: UPDATED_AT,
      dataAsOfDate: DATA_AS_OF_DATE,
      isRealtime: false,
      disclaimers: [DISCLAIMER],
    });
  }
}
