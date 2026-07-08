import { ApiProperty } from "@nestjs/swagger";

export class GetEnterpriseAiSummaryResponseDto {
  @ApiProperty({
    description: "銘柄コード",
    example: "8306",
  })
  symbolId: string;

  @ApiProperty({
    description: "企業名",
    example: "三菱UFJ FG",
  })
  companyName: string;

  @ApiProperty({
    description: "企業コード",
    example: "8306",
  })
  companyCode: string;

  @ApiProperty({
    description: "X投稿由来の要約",
    example: "配当方針と業績安定性への期待が多く見られます。",
    nullable: true,
    type: String,
  })
  tweetSummary: string | null;

  @ApiProperty({
    description: "X投稿由来のセンチメントスコア",
    example: 0.72,
    minimum: -1,
    maximum: 1,
    nullable: true,
    type: Number,
  })
  tweetSentimentScore: number | null;

  @ApiProperty({
    description: "コメント由来の要約",
    example: "株主還元と金利影響への関心が集まっています。",
    nullable: true,
    type: String,
  })
  commentSummary: string | null;

  @ApiProperty({
    description: "コメント由来のセンチメントスコア",
    example: 0.64,
    minimum: -1,
    maximum: 1,
    nullable: true,
    type: Number,
  })
  commentSentimentScore: number | null;

  @ApiProperty({
    description: "投資判断時の確認観点",
    example: "安定配当と金融環境の変化を合わせて確認する。",
    nullable: true,
    type: String,
  })
  investmentHints: string | null;

  @ApiProperty({
    description: "投資判断時の注意観点",
    example: "金利変動や与信費用の増加に注意する。",
    nullable: true,
    type: String,
  })
  investmentIssues: string | null;

  constructor(args: GetEnterpriseAiSummaryResponseDto) {
    this.symbolId = args.symbolId;
    this.companyName = args.companyName;
    this.companyCode = args.companyCode;
    this.tweetSummary = args.tweetSummary;
    this.tweetSentimentScore = args.tweetSentimentScore;
    this.commentSummary = args.commentSummary;
    this.commentSentimentScore = args.commentSentimentScore;
    this.investmentHints = args.investmentHints;
    this.investmentIssues = args.investmentIssues;
  }
}
