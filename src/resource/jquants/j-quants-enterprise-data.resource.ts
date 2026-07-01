import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { isAxiosError } from "axios";
import { firstValueFrom } from "rxjs";
import { AppConfigService } from "../../common/config/app-config.service";
import { AuthConfigurationException } from "../../common/error/auth-configuration.exception";
import { ResourceAccessException } from "../../common/error/resource-access.exception";
import type { JQuantsEnterpriseDataEntity } from "../../entity/enterprises/dividend-data-source.entity";

interface JQuantsListedInfoResponse {
  data?: unknown;
}

interface JQuantsDailyQuotesResponse {
  data?: unknown;
}

interface JQuantsStatementsResponse {
  data?: unknown;
}

type JsonRecord = Record<string, unknown>;
const JQUANTS_RATE_LIMIT_RETRY_MS = 60_000;

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
    const listedInfoBySymbol = await this.fetchListedInfoBySymbol();
    const entities: JQuantsEnterpriseDataEntity[] = [];
    for (const symbolId of symbolIds) {
      entities.push(
        await this.fetchOneEnterpriseData(
          symbolId,
          asOf,
          listedInfoBySymbol.get(symbolId) ?? {},
        ),
      );
    }
    return entities;
  }

  private async fetchOneEnterpriseData(
    symbolId: string,
    asOf: string,
    listedInfo: JsonRecord,
  ): Promise<JQuantsEnterpriseDataEntity> {
    const quote = await this.fetchDailyQuote(symbolId);
    const statement = await this.fetchStatement(symbolId);
    const close = numberValue(quote.AdjC ?? quote.C);
    const annualDividend = numberValue(statement.FDivAnn ?? statement.DivAnn);
    const eps = numberValue(statement.FEps ?? statement.FEPS ?? statement.EPS);
    const bps = numberValue(statement.BPS);
    const netProfit = numberValue(statement.NP);
    const equity = numberValue(statement.Eq);
    const equityRatio = numberValue(statement.EqAR);

    return {
      symbolId,
      companyName: stringValue(
        listedInfo.CoName ??
          listedInfo.CompanyName ??
          listedInfo.CoNameEn ??
          listedInfo.CompanyNameEnglish,
      ),
      market: nullableString(
        listedInfo.MktNm ?? listedInfo.MarketCodeName ?? listedInfo.MarketName,
      ),
      sector: nullableString(
        listedInfo.S33Nm ??
          listedInfo.S17Nm ??
          listedInfo.Sector33CodeName ??
          listedInfo.Sector17CodeName,
      ),
      dividendYield: numberValue(
        quote.DividendYield ?? statement.DividendYield,
      ) ?? percentage(annualDividend, close),
      payoutRatio: numberValue(
        statement.FPayoutRatioAnn ?? statement.PayoutRatioAnn ?? statement.PayoutRatio,
      ),
      per:
        numberValue(quote.AdjustmentClosePER ?? quote.PER ?? statement.PER) ??
        ratio(close, eps),
      pbr: numberValue(quote.PBR ?? statement.PBR) ?? ratio(close, bps),
      roe: numberValue(statement.ROE) ?? percentage(netProfit, equity),
      equityRatio:
        numberValue(statement.EquityRatio) ??
        (equityRatio === null ? null : roundNumber(equityRatio * 100)),
      edinetCode: nullableString(listedInfo.EDINETCode),
      fiscalYear:
        integerValue(statement.FiscalYear) ??
        yearValue(statement.CurFYEn ?? statement.CurrentFiscalYearEndDate),
      fiscalPeriodEnd: nullableString(
        statement.CurFYEn ??
          statement.CurrentFiscalYearEndDate ??
          statement.FiscalPeriodEnd,
      ),
      asOf,
    };
  }

  private async fetchListedInfoBySymbol(): Promise<Map<string, JsonRecord>> {
    const response =
      await this.get<JQuantsListedInfoResponse>("/v2/equities/master", {});
    const records = Array.isArray(response.data) ? response.data : [];
    const listedInfoBySymbol = new Map<string, JsonRecord>();
    for (const record of records) {
      if (!isRecord(record)) {
        continue;
      }
      const code = nullableString(record.Code);
      if (code === null || code.length < 4) {
        continue;
      }
      listedInfoBySymbol.set(code.slice(0, 4), record);
    }
    return listedInfoBySymbol;
  }

  private async fetchDailyQuote(symbolId: string): Promise<JsonRecord> {
    const response = await this.get<JQuantsDailyQuotesResponse>(
      "/v2/equities/bars/daily",
      { code: symbolId },
    );
    return lastRecord(response.data);
  }

  private async fetchStatement(symbolId: string): Promise<JsonRecord> {
    const response = await this.get<JQuantsStatementsResponse>(
      "/v2/fins/summary",
      { code: symbolId },
    );
    return lastRecord(response.data);
  }

  private async get<T>(
    path: string,
    params: Record<string, string>,
  ): Promise<T> {
    const apiKey = requiredConfig(
      "JQUANTS_API_KEY",
      this.config.jquantsApiKey ?? this.config.jquantsIdToken,
    );
    const url = new URL(path, this.config.jquantsApiBaseUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    let rateLimitRetries = 0;
    try {
      while (true) {
        try {
          const response = await firstValueFrom(
            this.httpService.get<T>(url.toString(), {
              headers: { "x-api-key": apiKey },
              timeout: this.config.enterpriseDataFetchTimeoutMs,
              maxRedirects: 0,
            }),
          );
          return response.data;
        } catch (error) {
          if (
            isAxiosError(error) &&
            error.response?.status === 429 &&
            rateLimitRetries < 3
          ) {
            rateLimitRetries += 1;
            await sleep(retryDelayMs(error.response.headers["retry-after"]));
            continue;
          }
          throw error;
        }
      }
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

const ratio = (numerator: number | null, denominator: number | null): number | null =>
  numerator !== null && denominator !== null && denominator !== 0
    ? roundNumber(numerator / denominator)
    : null;

const percentage = (
  numerator: number | null,
  denominator: number | null,
): number | null => {
  const value = ratio(numerator, denominator);
  return value === null ? null : roundNumber(value * 100);
};

const yearValue = (value: unknown): number | null => {
  if (typeof value !== "string") {
    return null;
  }
  const year = Number(value.slice(0, 4));
  return Number.isInteger(year) ? year : null;
};

const retryDelayMs = (retryAfter: unknown): number => {
  const retryAfterSeconds = Number(retryAfter);
  return Number.isFinite(retryAfterSeconds) && retryAfterSeconds > 0
    ? retryAfterSeconds * 1000
    : JQUANTS_RATE_LIMIT_RETRY_MS;
};

const sleep = (milliseconds: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

const roundNumber = (value: number): number => Number(value.toFixed(6));
