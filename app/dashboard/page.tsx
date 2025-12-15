"use client";

import * as React from "react";
import { ChartPieSimple } from "./components/pie-chart";
import { StatusLineChart } from "./components/line-chart";
import { TableJiraStatus } from "./components/jira-table";
import { FilterDropdownMenu } from "./components/filter-dropdown";
import type {
  DefectStatusName,
  DefectSummaryResponse,
  DueSummaryResponse,
  ChartPieData,
} from "@/types";
import {
  EXCLUDED_STATUSES_FOR_CHART,
  STATUS_TO_COLOR_MAP,
} from "@/lib/constants/jira";
import {
  fetchDefectSummary,
  fetchDefectQueryWithJql,
  fetchDefectStatusChanged,
} from "@/lib/api/defect";

/**
 * Fetches due date summary statistics from Jira
 * Returns counts for: empty due dates, due today, delayed, and unassigned issues
 */
async function fetchDueDateSummary(
  typeFilter: string,
): Promise<DueSummaryResponse> {
  // Fetch all due date statistics in parallel for better performance
  const [doneTodayJson, emptyJson, nowJson, delayedJson, assigneeEmptyJson] =
    await Promise.all([
      // Issues that were updated to Done status today (regardless of creation date)
      // Automatically builds: status = "Done" AND status CHANGED TO "Done" AFTER startOfDay()
      fetchDefectStatusChanged(typeFilter, "Done", "AFTER startOfDay()"),
      // Issues with no due date set
      fetchDefectQueryWithJql(typeFilter, "duedate is EMPTY"),
      // Issues due today
      fetchDefectQueryWithJql(typeFilter, "duedate = now()"),
      // Issues that are past due (delayed)
      fetchDefectQueryWithJql(typeFilter, "duedate < now()"),
      // Issues with no assignee
      fetchDefectQueryWithJql(typeFilter, "assignee = EMPTY"),
    ]);

  return {
    doneTodayTotal: doneTodayJson.total,
    emptyDueDateTotal: emptyJson.total,
    todayDueDateTotal: nowJson.total,
    delayedDueDateTotal: delayedJson.total,
    assigneeEmptyTotal: assigneeEmptyJson.total,
  };
}

/**
 * Main dashboard page component
 * Displays defect statistics with pie chart, line chart, and status tables
 */
export default function Page() {
  // State for filter selection (All, Bug, or Task)
  const [typeFilter, setTypeFilter] = React.useState("Bug");
  // State for defect summary data (counts by status)
  const [defectSummary, setDefectSummary] =
    React.useState<DefectSummaryResponse | null>(null);
  // State for due date summary data (empty, today, delayed, unassigned)
  const [dueDateSummary, setDueDateSummary] =
    React.useState<DueSummaryResponse | null>(null);
  // Loading state to show loading indicators
  const [loading, setLoading] = React.useState(true);
  // Error state to display error messages
  const [error, setError] = React.useState<string | null>(null);

  // Get Jira base URL from environment variable (used for building Jira links)
  const jiraBaseUrl = process.env.NEXT_PUBLIC_JIRA_BASE_URL || "";

  // Fetch data when type filter changes
  React.useEffect(() => {
    let cancelled = false;

    async function loadData() {
      setLoading(true);
      setError(null);
      try {
        // Fetch both defect summary and due date summary in parallel
        const [defectData, dueData] = await Promise.all([
          fetchDefectSummary(typeFilter),
          fetchDueDateSummary(typeFilter),
        ]);
        // Only update state if component is still mounted (prevent memory leaks)
        if (!cancelled) {
          setDefectSummary(defectData);
          setDueDateSummary(dueData);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : "Failed to fetch data",
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadData();

    // Cleanup function: cancel updates if component unmounts
    return () => {
      cancelled = true;
    };
  }, [typeFilter]);

  // Transform defect summary into chart data format
  // Filter out excluded statuses (Done, Canceled) and add color mapping
  const chartData: ChartPieData[] = defectSummary
    ? Object.entries(defectSummary.summary)
      .filter(
        ([status]) =>
          !EXCLUDED_STATUSES_FOR_CHART.has(status as DefectStatusName),
      )
      .map(([status, amount]) => {
        const typedStatus = status as DefectStatusName;

        return {
          status: typedStatus,
          amount,
          fill: STATUS_TO_COLOR_MAP[typedStatus],
        };
      })
    : [];

  return (
    <div className="flex flex-col gap-4">
      <div>
        <FilterDropdownMenu value={typeFilter} onValueChange={setTypeFilter} />
      </div>
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}
      <div className="grid gap-4 md:grid-cols-2">
        <ChartPieSimple chartData={chartData} loading={loading} />
        <StatusLineChart typeFilter={typeFilter} />
      </div>
      <div className="grid gap-4">
        <TableJiraStatus
          data={chartData}
          dueDateSummary={dueDateSummary ?? undefined}
          jiraBaseUrl={jiraBaseUrl}
          typeFilter={typeFilter}
          loading={loading}
        />
      </div>
    </div>
  );
}