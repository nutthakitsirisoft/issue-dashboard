/**
 * Client-side API utilities for defect queries
 * These functions handle communication with the backend API endpoints
 */

import type { DefectSummaryResponse } from "@/types";
import { DEFECT_STATUS_ORDER } from "@/lib/constants/jira";
import { BASE_URL } from "@/lib/constants/api";
import { escapeJql } from "@/lib/jira";

/**
 * Internal helper function to fetch defect summary with optional JQL filter
 * Builds query parameters and validates the API response
 *
 * @param typeFilter - Filter by issue type: "All", "Bug", or "Task"
 * @param additionalJql - Optional JQL clause to add to the query (e.g., "duedate is EMPTY")
 * @param specificStatus - Optional specific status to query. If provided, only queries this status. If not, queries all statuses from DEFECT_STATUS_ORDER
 * @returns Promise resolving to defect summary response
 */
async function fetchDefectQuery(
  typeFilter: string,
  additionalJql?: string,
  specificStatus?: string,
): Promise<DefectSummaryResponse> {
  // Build query parameters
  const params = new URLSearchParams();
  
  // If a specific status is provided, only query that status
  // Otherwise, query all statuses from DEFECT_STATUS_ORDER
  if (specificStatus) {
    params.append("status", specificStatus);
  } else {
    DEFECT_STATUS_ORDER.forEach((status) => {
      params.append("status", status);
    });
  }
  
  params.append("type", typeFilter);

  // Add optional JQL clause if provided (for filtering by due date, assignee, etc.)
  if (additionalJql) {
    params.append("jql", additionalJql);
  }

  // Fetch data from API endpoint
  const response = await fetch(`${BASE_URL}/api/defect/query?${params.toString()}`, {
    method: "GET",
    headers: { "Content-Type": "application/json" },
    cache: "no-store", // Always fetch fresh data, don't use cache
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch defect query: ${response.statusText}`);
  }

  const json = (await response.json()) as unknown;

  // Validate that response has the expected structure (summary and total fields)
  if (
    !json ||
    typeof json !== "object" ||
    !("summary" in json) ||
    !("total" in json)
  ) {
    throw new Error("Invalid defect summary response payload");
  }

  return json as DefectSummaryResponse;
}

/**
 * Fetches defect summary for all statuses without additional filters
 * Use this for getting the main status breakdown
 *
 * @param typeFilter - Filter by issue type: "All", "Bug", or "Task"
 */
export async function fetchDefectSummary(
  typeFilter: string,
): Promise<DefectSummaryResponse> {
  return fetchDefectQuery(typeFilter);
}

/**
 * Fetches defect summary with an additional JQL clause
 * Use this for filtering by due date, assignee, or other Jira fields
 *
 * @param typeFilter - Filter by issue type: "All", "Bug", or "Task"
 * @param jql - JQL clause to add (e.g., "duedate is EMPTY", "assignee = EMPTY", 'status CHANGED TO "Done" AFTER startOfDay()')
 * @param specificStatus - Optional specific status to query. If provided, only queries this status. If not, queries all statuses from DEFECT_STATUS_ORDER
 * @returns Promise resolving to defect summary response
 */
export async function fetchDefectQueryWithJql(
  typeFilter: string,
  jql: string,
  specificStatus?: string,
): Promise<DefectSummaryResponse> {
  return fetchDefectQuery(typeFilter, jql, specificStatus);
}

/**
 * Fetches count for issues that changed to a specific status within a time period
 * This is a convenience function that automatically builds the status change JQL
 *
 * @param typeFilter - Filter by issue type: "All", "Bug", or "Task"
 * @param status - The status to query for (e.g., "Done")
 * @param timeCondition - Time condition for the status change (e.g., "AFTER startOfDay()", "ON startOfDay()")
 * @returns Promise resolving to defect summary response
 */
export async function fetchDefectStatusChanged(
  typeFilter: string,
  status: string,
  timeCondition: string,
): Promise<DefectSummaryResponse> {
  // Automatically build the status change JQL using the provided status
  const jql = `status CHANGED TO ${escapeJql(status)} ${timeCondition}`;
  return fetchDefectQuery(typeFilter, jql, status);
}

