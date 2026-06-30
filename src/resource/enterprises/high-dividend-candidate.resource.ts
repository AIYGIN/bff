import { HttpService } from "@nestjs/axios";
import { Injectable, InternalServerErrorException } from "@nestjs/common";
import { readFileSync } from "node:fs";
import { isAxiosError } from "axios";
import { firstValueFrom } from "rxjs";
import { AppConfigService } from "../../common/config/app-config.service";
import { ResourceAccessException } from "../../common/error/resource-access.exception";
import type { HighDividendCandidateEntity } from "../../entity/enterprises/dividend-data-source.entity";

@Injectable()
export class HighDividendCandidateResource {
  constructor(
    private readonly httpService: HttpService,
    private readonly config: AppConfigService,
  ) {}

  async fetchTopCandidates(limit = 50): Promise<HighDividendCandidateEntity[]> {
    const remoteCandidates = await this.fetchRemoteCandidates(limit);
    if (remoteCandidates.length > 0) {
      return remoteCandidates;
    }
    return this.readCandidateCsv(limit);
  }

  private async fetchRemoteCandidates(
    limit: number,
  ): Promise<HighDividendCandidateEntity[]> {
    if (this.config.highDividendCandidateUrl === null) {
      return [];
    }
    try {
      const response = await firstValueFrom(
        this.httpService.get<string>(this.config.highDividendCandidateUrl, {
          responseType: "text",
          timeout: this.config.enterpriseDataFetchTimeoutMs,
          maxRedirects: 2,
        }),
      );
      return parseCandidateText(response.data).slice(0, limit);
    } catch (error) {
      if (isAxiosError(error)) {
        return [];
      }
      throw error;
    }
  }

  private readCandidateCsv(limit: number): HighDividendCandidateEntity[] {
    try {
      return parseCandidateText(
        readFileSync(this.config.highDividendCandidateCsvPath, "utf8"),
      ).slice(0, limit);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === "ENOENT") {
        throw new InternalServerErrorException({
          code: "HIGH_DIVIDEND_CANDIDATE_SOURCE_UNAVAILABLE",
        });
      }
      throw new ResourceAccessException("High dividend candidate source", {
        cause: error,
      });
    }
  }
}

export const parseCandidateText = (
  text: string,
): HighDividendCandidateEntity[] => {
  const seen = new Set<string>();
  const candidates: HighDividendCandidateEntity[] = [];
  for (const match of text.matchAll(/(?<!\d)(\d{4})(?!\d)/g)) {
    const symbolId = match[1];
    if (seen.has(symbolId)) {
      continue;
    }
    seen.add(symbolId);
    candidates.push({ symbolId, rank: candidates.length + 1 });
  }
  return candidates;
};
