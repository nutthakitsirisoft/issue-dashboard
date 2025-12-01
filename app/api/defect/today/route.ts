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
        const jql = `project = "${PROJECT_KEY}" AND type = ${ISSUE_TYPE} AND status = ${escapeJql(
          statusString,
        )}`;

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
    console.error("Unexpected error in defect today API route:", error);
    const message =
      error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}


