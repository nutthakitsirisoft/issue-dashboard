import { NextResponse } from "next/server";

type JiraEnv = {
  baseUrl: string;
  email: string;
  apiToken: string;
};

function getJiraEnv(): JiraEnv {
  const baseUrl = process.env.NEXT_PUBLIC_JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !apiToken) {
    throw new Error("Missing required JIRA_* environment variables");
  }

  return { baseUrl, email, apiToken };
}

function createAuthHeader(env: JiraEnv): string {
  const credentials = `${env.email}:${env.apiToken}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

// Escape status for JQL
function escapeJql(status: string): string {
  const escaped = status.replaceAll('"', String.raw`\"`);
  return `"${escaped}"`;
}

const PROJECT_KEY = "S2SWFE";

// Build type filter clause
function buildTypeClause(typeFilter: string): string {
  if (typeFilter === "All") {
    return "type IN (Bug, Task)";
  } else if (typeFilter === "Bug" || typeFilter === "Task") {
    return `type = ${typeFilter}`;
  } else {
    return "type = Bug"; // default
  }
}

const STATUSES = ["To Do", "In Progress", "Done"] as const;

type StatusKey = "todo" | "inProgress" | "done";

type DaySummary = {
  date: string;
  todo: number;
  inProgress: number;
  done: number;
};

// Format a Date as yyyy-MM-dd in the server's local timezone (your OS timezone),
// so that 2025-12-01 00:00 in Asia/Bangkok stays "2025-12-01" instead of
// becoming 2025-11-30 when converted to UTC.
function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function mapStatusToKey(status: (typeof STATUSES)[number]): StatusKey {
  switch (status) {
    case "To Do":
      return "todo";
    case "In Progress":
      return "inProgress";
    case "Done":
      return "done";
  }
}

async function fetchApproximateCount(jql: string): Promise<number> {
  const env = getJiraEnv();
  const authHeader = createAuthHeader(env);

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
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const typeFilter = searchParams.get("type") || "All";

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days: DaySummary[] = [];
    const typeClause = buildTypeClause(typeFilter);

    // Oldest first (6 days ago) up to today
    for (let offset = 6; offset >= 0; offset -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - offset);
      const nextDay = new Date(day);
      nextDay.setDate(day.getDate() + 1);

      const startStr = formatDateOnly(day);
      const endStr = formatDateOnly(nextDay);

      const baseJqlPrefix = `project = "${PROJECT_KEY}" AND ${typeClause}`;
      const dateWindow = `created >= "${startStr}" AND created < "${endStr}"`;

      const summary: DaySummary = {
        date: day.toISOString(),
        todo: 0,
        inProgress: 0,
        done: 0,
      };

      const counts = await Promise.all(
        STATUSES.map(async (status) => {
          const jql = `${baseJqlPrefix} AND status = ${escapeJql(
            status,
          )} AND ${dateWindow}`;
          const count = await fetchApproximateCount(jql);
          return { status, count };
        }),
      );

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


