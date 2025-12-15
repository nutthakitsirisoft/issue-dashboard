/**
 * Jira-related constants
 */

import type { DefectStatusName } from "@/types";

export const PROJECT_KEY = "S2SWFE" as const;

export const STATUSES = ["To Do", "In Progress", "Done"] as const;

export const DEFECT_STATUS_ORDER: readonly DefectStatusName[] = [
  "To Do",
  "In Progress",
  "Blocked",
  "Ready to test",
  "Reviewing",
  // "Done",
  // "Canceled",
] as const;

export const EXCLUDED_STATUSES_FOR_CHART: ReadonlySet<DefectStatusName> = new Set([
  "Canceled",
  "Done",
]);

export const STATUS_TO_COLOR_MAP: Readonly<Record<DefectStatusName, string>> = {
  Blocked: "var(--chart-1)",
  "In Progress": "var(--chart-2)",
  "Ready to test": "var(--chart-3)",
  Reviewing: "var(--chart-4)",
  "To Do": "var(--chart-5)",
  Done: "var(--chart-3)", // reuse chart colors for completed states
  Canceled: "var(--chart-2)",
} as const;

export type TypeFilter = "All" | "Bug" | "Task";

