/**
 * Jira-related types
 */

export type JiraEnv = {
  baseUrl: string;
  email: string;
  apiToken: string;
};

export type DefectStatusName =
  | "Blocked"
  | "Canceled"
  | "In Progress"
  | "Done"
  | "Ready to test"
  | "Reviewing"
  | "To Do";

export type StatusKey = "todo" | "inProgress" | "done";

export type DefectSummaryResponse = {
  summary: Record<DefectStatusName, number>;
  total: number;
};

export type DueSummaryResponse = {
  doneTodayTotal: number;
  emptyDueDateTotal: number;
  todayDueDateTotal: number;
  delayedDueDateTotal: number;
  assigneeEmptyTotal: number;
};

export type DaySummary = {
  date: string;
  todo: number;
  inProgress: number;
  done: number;
};

export type StatusCountResult = {
  status: string;
  count: number;
};

/**
 * @deprecated Use ChartPieData instead
 * Kept for backward compatibility
 */
export type DefectChartRow = ChartPieData;

export type DueDateSummary = {
  emptyDueDateTotal: number;
  todayDueDateTotal: number;
  delayedDueDateTotal: number;
  assigneeEmptyTotal: number;
};

export type LineChartPoint = {
  date: string;
  todo: number;
  inProgress: number;
  done: number;
};

export type ChartPieData = {
  readonly status: string;
  readonly amount: number;
  readonly fill: string;
};

