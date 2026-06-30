import { of, throwError } from "rxjs";
import {
  HighDividendCandidateResource,
  parseCandidateText,
} from "./high-dividend-candidate.resource";

describe("HighDividendCandidateResource", () => {
  it("extracts unique 4-digit symbol candidates in order", () => {
    expect(
      parseCandidateText("2914 JT\n8306 MUFG\n2914 duplicate\n9432"),
    ).toEqual([
      { symbolId: "2914", rank: 1 },
      { symbolId: "8306", rank: 2 },
      { symbolId: "9432", rank: 3 },
    ]);
  });

  it("falls back to candidate CSV when remote fetch fails", async () => {
    const resource = new HighDividendCandidateResource(
      {
        get: jest
          .fn()
          .mockReturnValue(throwError(() => ({ isAxiosError: true }))),
      } as never,
      {
        highDividendCandidateUrl: "https://example.com/candidates",
        highDividendCandidateCsvPath:
          "test/fixtures/enterprises/high-dividend-candidates.csv",
        enterpriseDataFetchTimeoutMs: 1000,
      } as never,
    );

    await expect(resource.fetchTopCandidates(2)).resolves.toEqual([
      { symbolId: "2914", rank: 1 },
      { symbolId: "8306", rank: 2 },
    ]);
  });

  it("uses remote candidates when available", async () => {
    const resource = new HighDividendCandidateResource(
      {
        get: jest.fn().mockReturnValue(of({ data: "8058\n9432\n" })),
      } as never,
      {
        highDividendCandidateUrl: "https://example.com/candidates",
        highDividendCandidateCsvPath:
          "test/fixtures/enterprises/high-dividend-candidates.csv",
        enterpriseDataFetchTimeoutMs: 1000,
      } as never,
    );

    await expect(resource.fetchTopCandidates(2)).resolves.toEqual([
      { symbolId: "8058", rank: 1 },
      { symbolId: "9432", rank: 2 },
    ]);
  });
});
