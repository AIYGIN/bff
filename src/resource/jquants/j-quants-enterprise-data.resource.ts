import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { isAxiosError } from "axios";
import { firstValueFrom } from "rxjs";
import { AppConfigService } from "../../common/config/app-config.service";
import { AuthConfigurationException } from "../../common/error/auth-configuration.exception";
import { ResourceAccessException } from "../../common/error/resource-access.exception";
import type { JQuantsEnterpriseDataEntity } from "../../entity/enterprises/dividend-data-source.entity";

interface JQuantsListedInfoResponse {
  info?: unknown;
}

interface JQuantsDailyQuotesResponse {
  daily_quotes?: unknown;
}

interface JQuantsStatementsResponse {
  statements?: unknown;
}

type JsonRecord = Record<string, unknown>;

@Injectable()
export class JQuantsEnterpriseDataResource {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: AppConfigService,
  ) {}

  async fetchEnterpriseData(
    symbolIds: string[],
    asOf: string,
  ): Promise<JQuantsEnterpriseDataEntity[]> {
    return Promise.all(
      symbolIds.map((symbolId) => this.fetchOneEnterpriseData(symbolId, asOf)),
    );
  }

  private async fetchOneEnterpriseData(
    symbolId: string,
    asOf: string,
  ): Promise<JQuantsEnterpriseDataEntity> {
    const [listedInfo, quote, statement] = await Promise.all([
      this.fetchListedInfo(symbolId),
      this.fetchDailyQuote(symbolId),
      this.fetchStatement(symbolId),
    ]);

    return {
      symbolId,
      companyName: stringValue(
        listedInfo.CompanyName ?? listedInfo.CompanyNameEnglish,
      ),
      market: nullableString(
        listedInfo.MarketCodeName ?? listedInfo.MarketName,
      ),
      sector: nullableString(
        listedInfo.Sector33CodeName ?? listedInfo.Sector17CodeName,
      ),
      dividendYield: numberValue(
        quote.DividendYield ?? statement.DividendYield,
      ),
      payoutRatio: numberValue(statement.PayoutRatio),
      per: numberValue(quote.AdjustmentClosePER ?? quote.PER ?? statement.PER),
      pbr: numberValue(quote.PBR ?? statement.PBR),
      roe: numberValue(statement.ROE),
      equityRatio: numberValue(statement.EquityRatio),
      edinetCode: nullableString(listedInfo.EDINETCode),
      fiscalYear: integerValue(statement.FiscalYear),
      fiscalPeriodEnd: nullableString(
        statement.CurrentFiscalYearEndDate ?? statement.FiscalPeriodEnd,
      ),
      asOf,
    };
  }

  private async fetchListedInfo(symbolId: string): Promise<JsonRecord> {
    const response = await this.get<JQuantsListedInfoResponse>(
      "/v1/listed/info",
      {
        code: symbolId,
      },
    );
    return firstRecord(response.info);
  }

  private async fetchDailyQuote(symbolId: string): Promise<JsonRecord> {
    const response = await this.get<JQuantsDailyQuotesResponse>(
      "/v1/prices/daily_quotes",
      { code: symbolId },
    );
    return lastRecord(response.daily_quotes);
  }

  private async fetchStatement(symbolId: string): Promise<JsonRecord> {
    const response = await this.get<JQuantsStatementsResponse>(
      "/v1/fins/statements",
      { code: symbolId },
    );
    return lastRecord(response.statements);
  }

  private async get<T>(
    path: string,
    params: Record<string, string>,
  ): Promise<T> {
    const idToken = requiredConfig(
      "JQUANTS_ID_TOKEN",
      this.config.jquantsIdToken,
    );
    const url = new URL(path, this.config.jquantsApiBaseUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(url.toString(), {
          headers: { Authorization: `Bearer ${idToken}` },
          timeout: this.config.enterpriseDataFetchTimeoutMs,
          maxRedirects: 0,
        }),
      );
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        throw new ResourceAccessException("J-Quants", { cause: error });
      }
      throw error;
    }
  }
}

const requiredConfig = (key: string, value: string | null): string => {
  if (value === null) {
    throw new AuthConfigurationException(key);
  }
  return value;
};

const firstRecord = (value: unknown): JsonRecord =>
  Array.isArray(value) && isRecord(value[0]) ? value[0] : {};

const lastRecord = (value: unknown): JsonRecord =>
  Array.isArray(value) && isRecord(value.at(-1)) ? value.at(-1) : {};

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string =>
  typeof value === "string" && value.trim() !== ""
    ? value.trim()
    : "TODO:企業名要確認";

const nullableString = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : null;

const numberValue = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string" && value.trim() !== "") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
};

const integerValue = (value: unknown): number | null => {
  const parsed = numberValue(value);
  return parsed !== null && Number.isInteger(parsed) ? parsed : null;
};
