export type FlatIssue = {
  key: string;
  summary: string;
  status: string;
  assignee: string | null;
  created: string;
  updated: string;
  link: string;
};

type JiraIssueFields = {
  summary: string;
  status?: {
    name?: string | null;
  } | null;
  assignee?: {
    displayName?: string | null;
  } | null;
  created: string;
  updated: string;
};

type JiraIssue = {
  key: string;
  fields: JiraIssueFields;
};

export type JiraSearchResponse = {
  issues: JiraIssue[];
};

export function normalizeJira(data: JiraSearchResponse): FlatIssue[] {
  if (!data || !Array.isArray(data.issues)) {
    return [];
  }

  return data.issues.map((issue) => ({
    key: issue.key,
    summary: issue.fields.summary,
    status: issue.fields.status?.name ?? "Unknown",
    assignee: issue.fields.assignee?.displayName ?? null,
    created: issue.fields.created,
    updated: issue.fields.updated,
    // Prefer linking against the Jira base URL at call site if needed
    link: `/browse/${issue.key}`,
  }));
}
