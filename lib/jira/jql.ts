/**
 * Jira Query Language (JQL) utilities
 */

import { PROJECT_KEY } from "@/lib/constants/jira";
import type { TypeFilter } from "@/lib/constants/jira";

/**
 * Escapes a status string for use in JQL queries
 */
export function escapeJql(status: string): string {
  const escaped = status.replaceAll('"', String.raw`\"`);
  return `"${escaped}"`;
}

/**
 * Builds a type filter clause for JQL queries
 */
export function buildTypeClause(typeFilter: TypeFilter | string): string {
  if (typeFilter === "All") {
    return "type IN (Bug, Task)";
  } else if (typeFilter === "Bug" || typeFilter === "Task") {
    return `type = ${typeFilter}`;
  } else {
    return "type = Bug"; // default
  }
}

/**
 * Builds a base JQL query with project and type filter
 */
export function buildBaseJql(typeFilter: TypeFilter | string, status?: string): string {
  let jql = `project = "${PROJECT_KEY}" AND ${buildTypeClause(typeFilter)}`;
  if (status) {
    jql += ` AND status = ${escapeJql(status)}`;
  }
  return jql;
}

/**
 * Builds a JIRA search URL from a JQL query
 */
export function buildJiraSearchUrl(baseUrl: string, jql: string): string {
  const encodedJql = encodeURIComponent(jql);
  return `${baseUrl}/issues/?jql=${encodedJql}`;
}

