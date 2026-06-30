import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Optional,
} from "@nestjs/common";
import { readFileSync } from "node:fs";

import {
  type DividendAnalysisEntity,
  type FreeCashFlowStatus,
} from "../../entity/enterprises/dividend-analysis.entity";
import { AppConfigService } from "../../common/config/app-config.service";

export interface FindDividendAnalysisOptions {
  scoreVersion?: string;
}

interface UnifiedCsvRow {
  scoreVersion: string;
  symbolId: string;
  companyName: string;
  market: string;
  sector: string;
  rank: string;
  dividendScore: string;
  dividendYield: string;
  payoutRatio: string;
  per: string;
  pbr: string;
  roe: string;
  equityRatio: string;
  freeCashFlow: string;
  freeCashFlowStatus: string;
  edinetCode: string;
  fiscalYear: string;
  fiscalPeriodEnd: string;
  jquantsAsOf: string;
  edinetAsOf: string;
  missingFields: string;
  warnings: string;
}

const REQUIRED_COLUMNS: Array<keyof UnifiedCsvRow> = [
  "scoreVersion",
  "symbolId",
  "companyName",
  "rank",
  "dividendScore",
  "dividendYield",
  "jquantsAsOf",
];

@Injectable()
export class UnifiedCsvEnterpriseDividendAnalysisResource {
  constructor(
    private readonly appConfigService: AppConfigService,
    @Optional() private readonly csvContentOverride?: string,
  ) {}

  findMany(
    options: FindDividendAnalysisOptions = {},
  ): DividendAnalysisEntity[] {
    const entities = this.parse();
    const scoreVersion =
      options.scoreVersion ?? this.resolveLatestScoreVersion(entities);
    return entities.filter((entity) => entity.scoreVersion === scoreVersion);
  }

  findOne(
    symbolId: string,
    options: FindDividendAnalysisOptions = {},
  ): DividendAnalysisEntity | null {
    return (
      this.findMany(options).find((entity) => entity.symbolId === symbolId) ??
      null
    );
  }

  private parse(): DividendAnalysisEntity[] {
    const [headerLine, ...dataLines] = this.readCsvContent()
      .trim()
      .split(/\r?\n/);
    const headers = parseCsvLine(headerLine) as Array<keyof UnifiedCsvRow>;
    const rows = dataLines
      .filter((line) => line.trim().length > 0)
      .map((line, index) => {
        const values = parseCsvLine(line);
        const row = Object.fromEntries(
          headers.map((header, valueIndex) => [
            header,
            values[valueIndex] ?? "",
          ]),
        ) as unknown as UnifiedCsvRow;
        return this.toEntity(row, index + 2);
      });

    this.assertUniqueRanks(rows);
    return rows;
  }

  private toEntity(
    row: UnifiedCsvRow,
    lineNumber: number,
  ): DividendAnalysisEntity {
    for (const column of REQUIRED_COLUMNS) {
      if (!row[column]) {
        throw new BadRequestException({
          code: "CSV_REQUIRED_FIELD_MISSING",
          lineNumber,
          column,
        });
      }
    }

    const rank = parseInteger(row.rank, lineNumber, "rank");
    if (rank < 1) {
      throw new BadRequestException({
        code: "CSV_NUMBER_OUT_OF_RANGE",
        lineNumber,
        column: "rank",
      });
    }
    const dividendScore = parseNumber(
      row.dividendScore,
      lineNumber,
      "dividendScore",
    );
    if (dividendScore < 0 || dividendScore > 100) {
      throw new BadRequestException({
        code: "CSV_NUMBER_OUT_OF_RANGE",
        lineNumber,
        column: "dividendScore",
      });
    }

    const freeCashFlowStatus = parseFreeCashFlowStatus(
      row.freeCashFlowStatus,
      lineNumber,
    );

    return {
      scoreVersion: row.scoreVersion,
      symbolId: row.symbolId,
      companyName: row.companyName,
      market: nullableString(row.market),
      sector: nullableString(row.sector),
      rank,
      dividendScore,
      metrics: {
        dividendYield: parseNumber(
          row.dividendYield,
          lineNumber,
          "dividendYield",
        ),
        payoutRatio: parseNullableNumber(
          row.payoutRatio,
          lineNumber,
          "payoutRatio",
        ),
        per: parseNullableNumber(row.per, lineNumber, "per"),
        pbr: parseNullableNumber(row.pbr, lineNumber, "pbr"),
        roe: parseNullableNumber(row.roe, lineNumber, "roe"),
        equityRatio: parseNullableNumber(
          row.equityRatio,
          lineNumber,
          "equityRatio",
        ),
        freeCashFlow: parseNullableNumber(
          row.freeCashFlow,
          lineNumber,
          "freeCashFlow",
        ),
        freeCashFlowStatus,
      },
      edinetCode: nullableString(row.edinetCode),
      fiscalYear: parseNullableInteger(
        row.fiscalYear,
        lineNumber,
        "fiscalYear",
      ),
      fiscalPeriodEnd: nullableString(row.fiscalPeriodEnd),
      jquantsAsOf: row.jquantsAsOf,
      edinetAsOf: nullableString(row.edinetAsOf),
      missingFields: parseJsonStringArray(
        row.missingFields,
        lineNumber,
        "missingFields",
      ),
      warnings: parseJsonStringArray(row.warnings, lineNumber, "warnings"),
    };
  }

  private resolveLatestScoreVersion(
    entities: DividendAnalysisEntity[],
  ): string {
    const versions = [
      ...new Set(entities.map((entity) => entity.scoreVersion)),
    ];
    return versions.at(-1) ?? "v1";
  }

  private assertUniqueRanks(entities: DividendAnalysisEntity[]): void {
    const ranksByVersion = new Map<string, Set<number>>();
    for (const entity of entities) {
      const ranks =
        ranksByVersion.get(entity.scoreVersion) ?? new Set<number>();
      if (ranks.has(entity.rank)) {
        throw new BadRequestException({
          code: "CSV_DUPLICATE_RANK",
          column: "rank",
        });
      }
      ranks.add(entity.rank);
      ranksByVersion.set(entity.scoreVersion, ranks);
    }
  }

  private readCsvContent(): string {
    if (this.csvContentOverride !== undefined) {
      return this.csvContentOverride;
    }

    try {
      return readFileSync(
        this.appConfigService.enterpriseDividendAnalysisCsvPath,
        "utf8",
      );
    } catch {
      throw new InternalServerErrorException({
        code: "ENTERPRISE_DIVIDEND_ANALYSIS_CSV_UNAVAILABLE",
      });
    }
  }
}

const parseCsvLine = (line: string): string[] => {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && inQuotes && nextCharacter === '"') {
      current += '"';
      index += 1;
      continue;
    }

    if (character === '"') {
      inQuotes = !inQuotes;
      continue;
    }

    if (character === "," && !inQuotes) {
      values.push(current);
      current = "";
      continue;
    }

    current += character;
  }

  values.push(current);
  return values;
};

const nullableString = (value: string): string | null =>
  value.trim() === "" ? null : value;

const parseNumber = (
  value: string,
  lineNumber: number,
  column: string,
): number => {
  const numberValue = Number(value);
  if (!Number.isFinite(numberValue)) {
    throw new BadRequestException({
      code: "CSV_INVALID_NUMBER",
      lineNumber,
      column,
    });
  }
  return numberValue;
};

const parseInteger = (
  value: string,
  lineNumber: number,
  column: string,
): number => {
  const numberValue = parseNumber(value, lineNumber, column);
  if (!Number.isInteger(numberValue)) {
    throw new BadRequestException({
      code: "CSV_INVALID_INTEGER",
      lineNumber,
      column,
    });
  }
  return numberValue;
};

const parseNullableNumber = (
  value: string,
  lineNumber: number,
  column: string,
): number | null =>
  value.trim() === "" ? null : parseNumber(value, lineNumber, column);

const parseNullableInteger = (
  value: string,
  lineNumber: number,
  column: string,
): number | null =>
  value.trim() === "" ? null : parseInteger(value, lineNumber, column);

const parseFreeCashFlowStatus = (
  value: string,
  lineNumber: number,
): FreeCashFlowStatus => {
  if (
    value === "AVAILABLE" ||
    value === "NOT_APPLICABLE" ||
    value === "MISSING"
  ) {
    return value;
  }
  throw new BadRequestException({
    code: "CSV_INVALID_ENUM",
    lineNumber,
    column: "freeCashFlowStatus",
  });
};

const parseJsonStringArray = (
  value: string,
  lineNumber: number,
  column: string,
): string[] => {
  if (value.trim() === "") {
    return [];
  }
  try {
    const parsed = JSON.parse(value);
    if (
      Array.isArray(parsed) &&
      parsed.every((item) => typeof item === "string")
    ) {
      return parsed;
    }
  } catch (_error) {
    // fall through to sanitized validation error
  }
  throw new BadRequestException({
    code: "CSV_INVALID_JSON_STRING_ARRAY",
    lineNumber,
    column,
  });
};
