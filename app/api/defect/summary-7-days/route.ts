import { NextResponse } from "next/server";
import {
  fetchApproximateCount,
  buildTypeClause,
  escapeJql,
  formatDateOnly,
  mapStatusToKey,
} from "@/lib/jira";
import { STATUSES, PROJECT_KEY } from "@/lib/constants/jira";
import type { DaySummary } from "@/types";

/**
 * API endpoint to get defect summary for the last 7 days
 * Returns daily counts for each status (To Do, In Progress, Done)
 *
 * Query parameters:
 * - type: Filter by issue type - "Bug", "Task", or "All" (default: "All")
 *
 * Returns: { days: [{ date: string, todo: number, inProgress: number, done: number }] }
 *           Each day object contains counts for each status
 *           Fields: todo (To Do count), inProgress, done
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type") || "All";

    // Set today to start of day (midnight) for consistent date calculations
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: DaySummary[] = [];
    const typeClause = buildTypeClause(typeFilter);

    // Loop through last 7 days (from 6 days ago to today)
    // We go backwards so oldest day is first in the array
    for (let offset = 6; offset >= 0; offset -= 1) {
      // Calculate the date for this day (offset days ago from today)
      const day = new Date(today);
      day.setDate(today.getDate() - offset);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      // Format dates as YYYY-MM-DD for JQL query
      const startStr = formatDateOnly(day);
      const endStr = formatDateOnly(nextDay);

      // Build base JQL query with project and type filter
      const baseJqlPrefix = `project = "${PROJECT_KEY}" AND ${typeClause}`;
      // Create date range filter for issues created on this specific day
      const dateWindow = `created >= "${startStr}" AND created < "${endStr}"`;

      // Initialize summary object for this day
      const summary: DaySummary = {
        date: day.toISOString(),
        todo: 0,
        inProgress: 0,
        done: 0,
      };

      // Fetch counts for all statuses in parallel for better performance
      const counts = await Promise.all(
        STATUSES.map(async (status) => {
          // Build JQL query: project + type + status + date range
          const jql = `${baseJqlPrefix} AND status = ${escapeJql(
            status,
          )} AND ${dateWindow}`;
          const count = await fetchApproximateCount(jql);
          return { status, count };
        }),
      );

      // Map status counts to summary object
      for (const { status, count } of counts) {
        const key = mapStatusToKey(status);
        summary[key] = count;
      }

      days.push(summary);
    }

    return NextResponse.json({ days }, { status: 200 });
  } catch (error) {
    console.error("Error fetching 7-day defect summary:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


