/**
 * Jira API client utilities
 */

import { createAuthHeader, getJiraEnv } from "./env";

/**
 * Fetches an approximate count from Jira API using the approximate-count endpoint
 * @param jql - JQL query string
 * @returns Promise resolving to the count, or 0 if the request fails
 */
export async function fetchApproximateCount(jql: string): Promise<number> {
  const env = getJiraEnv();
  const authHeader = createAuthHeader(env);

  try {
    const res = await fetch(
      `${env.baseUrl}/rest/api/3/search/approximate-count`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ jql }),
        cache: "no-store",
      },
    );

    const text = await res.text();
    let data: unknown = null;

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = null;
      }
    }

    const count =
      data &&
      typeof data === "object" &&
      "count" in data &&
      typeof (data as { count: unknown }).count === "number"
        ? (data as { count: number }).count
        : 0;

    return count;
  } catch (error) {
    console.error("Error fetching Jira approximate count:", error);
    return 0;
  }
}

