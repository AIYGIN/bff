export interface EnterpriseAiSummaryEntity {
  symbolId: string;
  companyName: string;
  companyCode: string;
  tweetSummary: string | null;
  tweetSentimentScore: number | null;
  commentSummary: string | null;
  commentSentimentScore: number | null;
  investmentHints: string | null;
  investmentIssues: string | null;
}
