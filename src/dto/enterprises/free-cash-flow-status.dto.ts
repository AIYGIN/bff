export const FREE_CASH_FLOW_STATUSES = [
  "AVAILABLE",
  "NOT_APPLICABLE",
  "MISSING",
] as const;

export type FreeCashFlowStatusDto = (typeof FREE_CASH_FLOW_STATUSES)[number];
