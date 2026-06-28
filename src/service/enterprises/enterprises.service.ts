import { Injectable, NotFoundException } from "@nestjs/common";

import { GetEnterpriseDividendAnalysisResponseDto } from "../../dto/enterprises/get-enterprise-dividend-analysis-response.dto";
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

  getDividendAnalysis(
    symbolId: string,
  ): GetEnterpriseDividendAnalysisResponseDto {
    const dividendAnalysis =
      this.quantsInfoResource.findOneDividendAnalysisFromJQuantsApiMock(
        symbolId,
      );

    if (dividendAnalysis === null) {
      throw new NotFoundException("Dividend analysis not found");
    }

    return new GetEnterpriseDividendAnalysisResponseDto({
      ...dividendAnalysis,
      analysisSummary: null,
      dataSources: [
        { name: "J-Quants API mock", asOfDate: dividendAnalysis.dataAsOfDate },
      ],
      scoreVersion: "dividend-score-v1",
      isRealtime: false,
      disclaimers: [DISCLAIMER],
    });
  }
}
