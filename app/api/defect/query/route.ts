import { NextResponse } from "next/server";
import {
  fetchApproximateCount,
  buildBaseJql,
} from "@/lib/jira";
import type { StatusCountResult } from "@/types";

/**
 * API endpoint to query defect counts by status
 * Supports filtering by type (Bug/Task/All) and optional JQL clauses
 *
 * Query parameters:
 * - status: One or more status names (can be repeated: ?status=To%20Do&status=In%20Progress)
 * - statuses: Comma-separated list of statuses (alternative to status param)
 * - type: Filter by issue type - "Bug", "Task", or "All" (default: "Bug")
 * - time: Optional JQL time clause (e.g., "created >= startOfDay()")
 * - jql: Optional additional JQL clause (e.g., "duedate is EMPTY")
 *
 * Returns: { summary: { [status]: count }, total: number }
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Extract query parameters for filtering and JQL customization
    const timeClause = searchParams.get("time");
    const extraJqlClause = searchParams.get("jql");
    const typeFilter = searchParams.get("type") || "Bug";

    // Support multiple ways to pass statuses:
    // Method 1: Multiple query params (?status=To%20Do&status=In%20Progress)
    // Method 2: Comma-separated string (?statuses=To%20Do,In%20Progress)
    const statusParams = searchParams.getAll("status");
    const csvStatuses = searchParams.get("statuses");

    // Parse statuses from query params (support both formats)
    let statusesRaw: unknown;
    if (statusParams.length > 0) {
      statusesRaw = statusParams;
    } else if (csvStatuses) {
      statusesRaw = csvStatuses.split(",");
    } else {
      statusesRaw = [];
    }

    // Validate that at least one status was provided
    if (!Array.isArray(statusesRaw) || statusesRaw.length === 0) {
      return NextResponse.json(
        { error: "Query must include at least one status" },
        { status: 400 },
      );
    }

    // Build JQL queries for each status and fetch counts in parallel
    const results: StatusCountResult[] = await Promise.all(
      statusesRaw.map(async (status) => {
        const statusString = String(status);
        // Start with base JQL (project + type filter + status)
        let jql = buildBaseJql(typeFilter, statusString);

        // Add optional time filter if provided
        if (timeClause) {
          jql += ` AND ${timeClause}`;
        }

        // Add optional additional JQL clause if provided
        if (extraJqlClause) {
          jql += ` AND (${extraJqlClause})`;
        }

        // Fetch count from Jira API
        const count = await fetchApproximateCount(jql);
        return { status: statusString, count };
      }),
    );

    // Aggregate results into summary object and calculate total
    const summary: Record<string, number> = {};
    let total = 0;

    for (const result of results) {
      summary[result.status] = result.count;
      total += result.count;
    }

    return NextResponse.json({ summary, total }, { status: 200 });
  } catch (error) {
    console.error("Unexpected error in defect query API route:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


