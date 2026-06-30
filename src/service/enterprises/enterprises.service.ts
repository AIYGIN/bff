import { Injectable, NotFoundException } from "@nestjs/common";

import { type DividendAnalysisEntity } from "../../entity/enterprises/dividend-analysis.entity";
import { GetEnterpriseDividendAnalysisResponseDto } from "../../dto/enterprises/get-enterprise-dividend-analysis-response.dto";
import {
  type EnterpriseQuantsInfoOrder,
  type EnterpriseQuantsInfoSort,
  type GetEnterpriseDividendAnalysisQueryDto,
  type GetEnterpriseQuantsInfoQueryDto,
} from "../../dto/enterprises/get-enterprise-quants-info-query.dto";
import { GetEnterpriseQuantsInfoResponseDto } from "../../dto/enterprises/get-enterprise-quants-info-response.dto";
import { UnifiedCsvEnterpriseDividendAnalysisResource } from "../../resource/enterprises/unified-csv-enterprise-dividend-analysis.resource";
import { calculateDividendAnalysis } from "../../utility/enterprises/dividend-score-calculator";

const DEFAULT_LIMIT = 50;
const DEFAULT_SORT: EnterpriseQuantsInfoSort = "dividendScore";
const DEFAULT_ORDER: EnterpriseQuantsInfoOrder = "desc";

@Injectable()
export class EnterprisesService {
  constructor(
    private readonly dividendAnalysisResource: UnifiedCsvEnterpriseDividendAnalysisResource,
  ) {}

  getQuantsInfo(
    query: GetEnterpriseQuantsInfoQueryDto = {},
  ): GetEnterpriseQuantsInfoResponseDto {
    const sort = query.sort ?? DEFAULT_SORT;
    const order = query.order ?? DEFAULT_ORDER;
    const limit = query.limit ?? DEFAULT_LIMIT;
    const entities = this.dividendAnalysisResource.findMany({
      scoreVersion: query.scoreVersion,
    });
    const items = [...entities]
      .sort((left, right) => compareEntities(left, right, sort, order))
      .slice(0, limit);
    const firstItem = items[0] ?? entities[0];

    return new GetEnterpriseQuantsInfoResponseDto({
      scoreVersion: firstItem?.scoreVersion ?? query.scoreVersion ?? "v1",
      asOf: firstItem?.jquantsAsOf ?? "",
      sort,
      order,
      items: items.map((entity) => ({
        rank: entity.rank,
        symbolId: entity.symbolId,
        companyName: entity.companyName,
        market: entity.market,
        sector: entity.sector,
        dividendScore: entity.dividendScore,
        dividendYield: entity.metrics.dividendYield,
        payoutRatio: entity.metrics.payoutRatio,
        per: entity.metrics.per,
        pbr: entity.metrics.pbr,
        roe: entity.metrics.roe,
        equityRatio: entity.metrics.equityRatio,
        freeCashFlowStatus: entity.metrics.freeCashFlowStatus,
        missingFields: entity.missingFields,
        warnings: entity.warnings,
      })),
    });
  }

  getDividendAnalysis(
    symbolId: string,
    query: GetEnterpriseDividendAnalysisQueryDto = {},
  ): GetEnterpriseDividendAnalysisResponseDto {
    const dividendAnalysis = this.dividendAnalysisResource.findOne(symbolId, {
      scoreVersion: query.scoreVersion,
    });

    if (dividendAnalysis === null) {
      throw new NotFoundException("Dividend analysis not found");
    }

    const analysis = calculateDividendAnalysis(dividendAnalysis);

    return new GetEnterpriseDividendAnalysisResponseDto({
      symbolId: dividendAnalysis.symbolId,
      companyName: dividendAnalysis.companyName,
      scoreVersion: dividendAnalysis.scoreVersion,
      asOf: dividendAnalysis.jquantsAsOf,
      rank: dividendAnalysis.rank,
      dividendScore: dividendAnalysis.dividendScore,
      metrics: dividendAnalysis.metrics,
      analysis,
      missingFields: dividendAnalysis.missingFields,
      warnings: dividendAnalysis.warnings,
    });
  }
}

const compareEntities = (
  left: DividendAnalysisEntity,
  right: DividendAnalysisEntity,
  sort: EnterpriseQuantsInfoSort,
  order: EnterpriseQuantsInfoOrder,
): number => {
  const direction = order === "asc" ? 1 : -1;
  const leftValue = getSortValue(left, sort);
  const rightValue = getSortValue(right, sort);

  if (leftValue === rightValue) {
    return left.rank - right.rank;
  }

  return leftValue > rightValue ? direction : -direction;
};

const getSortValue = (
  entity: DividendAnalysisEntity,
  sort: EnterpriseQuantsInfoSort,
): number => {
  if (sort === "rank") {
    return entity.rank;
  }
  if (sort === "dividendScore") {
    return entity.dividendScore;
  }
  return entity.metrics[sort] ?? Number.NEGATIVE_INFINITY;
};
