import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { isAxiosError } from "axios";
import { firstValueFrom } from "rxjs";
import { AppConfigService } from "../../../common/config/app-config.service";
import { AuthConfigurationException } from "../../../common/error/auth-configuration.exception";
import { ResourceAccessException } from "../../../common/error/resource-access.exception";
import type { EdinetFinancialDataEntity } from "../../../entity/enterprises/dividend-data-source.entity";

interface EdinetDocumentsResponse {
  results?: unknown;
}

type JsonRecord = Record<string, unknown>;

@Injectable()
export class EdinetEnterpriseFilingResource {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: AppConfigService,
  ) {}

  async fetchFinancialData(
    edinetCode: string | null,
    asOf: string,
    sector: string | null,
  ): Promise<EdinetFinancialDataEntity> {
    if (edinetCode === null) {
      return missingFinancialData("", "TODO:EDINETコード要確認");
    }
    if (isFinancialSector(sector)) {
      return {
        edinetCode,
        freeCashFlow: null,
        freeCashFlowStatus: "NOT_APPLICABLE",
        asOf,
        warnings: ["financial_sector_fcf_na"],
        notAvailableReason: "金融業のためFCFはN/A",
      };
    }

    const documentId = await this.findLatestDocumentId(edinetCode, asOf);
    if (documentId === null) {
      return missingFinancialData(edinetCode, "TODO:EDINET書類未検出");
    }
    const xbrlText = await this.fetchXbrlText(documentId);
    const freeCashFlow = extractFreeCashFlow(xbrlText);
    if (freeCashFlow === null) {
      return missingFinancialData(edinetCode, "TODO:FCF抽出要確認");
    }

    return {
      edinetCode,
      freeCashFlow,
      freeCashFlowStatus: "AVAILABLE",
      asOf,
      warnings: [],
      notAvailableReason: null,
    };
  }

  private async findLatestDocumentId(
    edinetCode: string,
    asOf: string,
  ): Promise<string | null> {
    const response = await this.get<EdinetDocumentsResponse>("documents.json", {
      date: asOf,
      type: "2",
    });
    const documents = Array.isArray(response.results) ? response.results : [];
    const matched = documents.find(
      (document): document is JsonRecord =>
        isRecord(document) &&
        stringValue(document.edinetCode) === edinetCode &&
        stringValue(document.docID) !== null,
    );
    return matched === undefined ? null : stringValue(matched.docID);
  }

  private async fetchXbrlText(documentId: string): Promise<string> {
    const data = await this.get<string>(`documents/${documentId}`, {
      type: "1",
    });
    return typeof data === "string" ? data : "";
  }

  private async get<T>(
    path: string,
    params: Record<string, string>,
  ): Promise<T> {
    const apiKey = requiredConfig("EDINET_API_KEY", this.config.edinetApiKey);
    const url = new URL(path, this.config.edinetApiBaseUrl);
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.set(key, value);
    }
    try {
      const response = await firstValueFrom(
        this.httpService.get<T>(url.toString(), {
          headers: { "Subscription-Key": apiKey },
          timeout: this.config.enterpriseDataFetchTimeoutMs,
          maxRedirects: 0,
          responseType: path.includes("documents/") ? "text" : "json",
        }),
      );
      return response.data;
    } catch (error) {
      if (isAxiosError(error)) {
        throw new ResourceAccessException("EDINET", { cause: error });
      }
      throw error;
    }
  }
}

export const extractFreeCashFlow = (xbrlText: string): number | null => {
  const operatingCashFlow = extractXbrlNumber(xbrlText, [
    "NetCashProvidedByUsedInOperatingActivities",
    "CashFlowsFromUsedInOperatingActivities",
  ]);
  const investingCashFlow = extractXbrlNumber(xbrlText, [
    "NetCashProvidedByUsedInInvestmentActivities",
    "CashFlowsFromUsedInInvestingActivities",
  ]);
  if (operatingCashFlow === null || investingCashFlow === null) {
    return null;
  }
  return operatingCashFlow + investingCashFlow;
};

const extractXbrlNumber = (
  xbrlText: string,
  localNames: string[],
): number | null => {
  for (const localName of localNames) {
    const escaped = localName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `<[^>]*${escaped}[^>]*>([-+]?\\d+(?:\\.\\d+)?)<\\/[^>]+>`,
      "i",
    );
    const match = xbrlText.match(pattern);
    if (match !== null) {
      const parsed = Number(match[1]);
      return Number.isFinite(parsed) ? parsed : null;
    }
  }
  return null;
};

const missingFinancialData = (
  edinetCode: string,
  notAvailableReason: string,
): EdinetFinancialDataEntity => ({
  edinetCode,
  freeCashFlow: null,
  freeCashFlowStatus: "MISSING",
  asOf: null,
  warnings: ["edinet_fcf_missing"],
  notAvailableReason,
});

const isFinancialSector = (sector: string | null): boolean =>
  sector !== null && /銀行|証券|保険|金融/.test(sector);

const requiredConfig = (key: string, value: string | null): string => {
  if (value === null) {
    throw new AuthConfigurationException(key);
  }
  return value;
};

const isRecord = (value: unknown): value is JsonRecord =>
  value !== null && typeof value === "object" && !Array.isArray(value);

const stringValue = (value: unknown): string | null =>
  typeof value === "string" && value.trim() !== "" ? value.trim() : null;
