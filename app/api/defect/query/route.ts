import { NextResponse } from "next/server";

type JiraEnv = {
  baseUrl: string;
  email: string;
  apiToken: string;
};

function getJiraEnv(): JiraEnv {
  const baseUrl = process.env.JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !apiToken) {
    throw new Error("Missing required JIRA_* environment variables");
  }

  return { baseUrl, email, apiToken };
}

function createAuthHeader(env: JiraEnv): string {
  return `Basic ${Buffer.from(`${env.email}:${env.apiToken}`).toString(
    "base64",
  )}`;
}

// Escape status for JQL
function escapeJql(status: string): string {
  return `"${status.replace(/"/g, '\\"')}"`;
}

const PROJECT_KEY = "S2SWFE";
const ISSUE_TYPE = "Bug";

async function fetchApproximateCount(jql: string): Promise<number> {
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

type StatusCountResult = {
  status: string;
  count: number;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Optional extra JQL controls:
    // - time:   arbitrary JQL time clause, e.g. `created >= startOfDay()` or `updated >= -7d`
    // - jql:    any additional JQL clause, e.g. `duedate is EMPTY` or `duedate = now()`
    //
    // Both are appended with AND to the base query for every requested status.
    const timeClause = searchParams.get("time");
    const extraJqlClause = searchParams.get("jql");
    console.log("searchParams", searchParams);
    // Support either:
    // - ?status=To%20Do&status=In%20Progress
    // - or ?statuses=To%20Do,In%20Progress
    const statusParams = searchParams.getAll("status");
    const csvStatuses = searchParams.get("statuses");

    const statusesRaw: unknown =
      statusParams.length > 0
        ? statusParams
        : csvStatuses
          ? csvStatuses.split(",")
          : [];

    if (!Array.isArray(statusesRaw) || statusesRaw.length === 0) {
      return NextResponse.json(
        { error: "Query must include at least one status" },
        { status: 400 },
      );
    }

    const results: StatusCountResult[] = await Promise.all(
      statusesRaw.map(async (status) => {
        const statusString = String(status);
        let jql = `project = "${PROJECT_KEY}" AND type = ${ISSUE_TYPE} AND status = ${escapeJql(
          statusString,
        )}`;

        if (timeClause) {
          // Example: time=created >= startOfDay()
          jql += ` AND ${timeClause}`;
        }

        if (extraJqlClause) {
          // Example: jql=duedate is EMPTY
          jql += ` AND (${extraJqlClause})`;
        }

        const count = await fetchApproximateCount(jql);
        return { status: statusString, count };
      }),
    );

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


