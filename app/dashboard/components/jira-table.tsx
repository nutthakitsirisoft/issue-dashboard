"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertCircle } from "lucide-react";
import type { TableJiraStatusProps } from "@/types";
import { escapeJql, buildBaseJql, buildJiraSearchUrl } from "@/lib/jira";

/**
 * Table component displaying Jira defect status counts
 * Shows both focused summary (due dates, assignees) and status breakdown
 * Clicking a row opens the corresponding Jira search in a new tab
 */
export function TableJiraStatus({
  data,
  dueDateSummary,
  jiraBaseUrl,
  typeFilter,
  loading = false,
}: Readonly<TableJiraStatusProps>) {
  // Extract statuses from chart data and build JQL query for filtering
  // This creates a query that includes all statuses shown in the table
  const statuses = data.map((row) => row.status);
  const statusJql = statuses
    .map((status) => `status = ${escapeJql(status)}`)
    .join(" OR ");
  // Base JQL includes project, type filter, and all statuses
  const baseJqlWithStatuses = `${buildBaseJql(typeFilter)} AND (${statusJql})`;

  /**
   * Handles row click - opens Jira search page with the corresponding JQL query
   * Validates that Jira base URL is configured before opening
   */
  const handleRowClick = (jql: string) => {
    if (!jiraBaseUrl || jiraBaseUrl.trim() === "") {
      console.error(
        "JIRA base URL is not configured. Please set NEXT_PUBLIC_JIRA_BASE_URL environment variable.",
      );
      alert(
        "JIRA base URL is not configured. Please contact your administrator.",
      );
      return;
    }
    const url = buildJiraSearchUrl(jiraBaseUrl, jql);
    window.open(url, "_blank", "noopener,noreferrer");
  };

  if (loading) {
    return (
      <div className="flex flex-row gap-6">
        <div className="flex-1">
          <div className="rounded-lg border">
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
        <div className="flex-1">
          <div className="rounded-lg border">
            <div className="flex h-[200px] items-center justify-center">
              <p className="text-muted-foreground">Loading...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-row gap-6">
      {dueDateSummary && (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[180px]">Focused Summary</TableHead>
              <TableHead className="text-right">Amount</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => {
                // Query for issues that are currently Done AND changed to Done today
                // This finds all work updated to Done today, regardless of creation date
                const jql = `${buildBaseJql(typeFilter, "Done")} AND (status CHANGED TO ${escapeJql("Done")} AFTER startOfDay())`;
                handleRowClick(jql);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  // Query for issues that are currently Done AND changed to Done today
                  // This finds all work updated to Done today, regardless of creation date
                  const jql = `${buildBaseJql(typeFilter, "Done")} AND (status CHANGED TO ${escapeJql("Done")} AFTER startOfDay())`;
                  handleRowClick(jql);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <TableCell className="font-medium">
                <AlertCircle className="mr-2 inline-block h-4 w-4 align-middle text-green-500" />
                <span className="align-middle">Done Today</span>
              </TableCell>
              <TableCell className="text-right">
                {dueDateSummary.doneTodayTotal}
              </TableCell>
            </TableRow>
            <TableRow
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => {
                const jql = `${baseJqlWithStatuses} AND (duedate is EMPTY)`;
                handleRowClick(jql);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const jql = `${baseJqlWithStatuses} AND (duedate is EMPTY)`;
                  handleRowClick(jql);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <TableCell className="font-medium">
                <AlertCircle className="mr-2 inline-block h-4 w-4 align-middle text-red-500" />
                <span className="align-middle">No Due Date</span>
              </TableCell>
              <TableCell className="text-right">
                {dueDateSummary.emptyDueDateTotal}
              </TableCell>
            </TableRow>
            <TableRow
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => {
                const jql = `${baseJqlWithStatuses} AND (duedate = now())`;
                handleRowClick(jql);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const jql = `${baseJqlWithStatuses} AND (duedate = now())`;
                  handleRowClick(jql);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <TableCell className="font-medium">
                <AlertCircle className="mr-2 inline-block h-4 w-4 align-middle text-red-500" />
                <span className="align-middle">Due Today</span>
              </TableCell>
              <TableCell className="text-right">
                {dueDateSummary.todayDueDateTotal}
              </TableCell>
            </TableRow>
            <TableRow
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => {
                const jql = `${baseJqlWithStatuses} AND (duedate < now())`;
                handleRowClick(jql);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const jql = `${baseJqlWithStatuses} AND (duedate < now())`;
                  handleRowClick(jql);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <TableCell className="font-medium">
                <AlertCircle className="mr-2 inline-block h-4 w-4 align-middle text-red-500" />
                <span className="align-middle">Delayed</span>
              </TableCell>
              <TableCell className="text-right">
                {dueDateSummary.delayedDueDateTotal}
              </TableCell>
            </TableRow>
            <TableRow
              className="cursor-pointer hover:bg-muted/50"
              onClick={() => {
                const jql = `${baseJqlWithStatuses} AND (assignee = EMPTY)`;
                handleRowClick(jql);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  const jql = `${baseJqlWithStatuses} AND (assignee = EMPTY)`;
                  handleRowClick(jql);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <TableCell className="font-medium">
                <AlertCircle className="mr-2 inline-block h-4 w-4 align-middle text-red-500" />
                <span className="align-middle">No Assignee</span>
              </TableCell>
              <TableCell className="text-right">
                {dueDateSummary.assigneeEmptyTotal}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[180px]">Status</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row) => {
            const jql = buildBaseJql(typeFilter, row.status);
            return (
              <TableRow
                key={row.status}
                className="cursor-pointer hover:bg-muted/50"
                onClick={() => handleRowClick(jql)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    handleRowClick(jql);
                  }
                }}
                role="button"
                tabIndex={0}
              >
                <TableCell className="font-medium">
                  <span
                    className="mr-2 inline-block h-3 w-3 rounded-full align-middle"
                    style={{ backgroundColor: row.fill }}
                  />
                  <span className="align-middle">{row.status}</span>
                </TableCell>
                <TableCell className="text-right">{row.amount}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
