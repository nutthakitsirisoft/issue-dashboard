/**
 * Component prop types
 */

import type { ChartPieData, DueSummaryResponse } from "./jira";

export type FilterDropdownMenuProps = {
  readonly value: string;
  readonly onValueChange: (value: string) => void;
};

export type TableJiraStatusProps = {
  readonly data: readonly ChartPieData[];
  readonly dueDateSummary?: DueSummaryResponse;
  readonly jiraBaseUrl: string;
  readonly typeFilter: string;
  readonly loading?: boolean;
};

export type StatusLineChartProps = {
  readonly typeFilter: string;
};

export type ChartPieSimpleProps = {
  readonly chartData: readonly import("./jira").ChartPieData[];
  readonly loading?: boolean;
};

