/**
 * Jira environment configuration utilities
 */

import type { JiraEnv } from "@/types";

/**
 * Retrieves and validates Jira environment variables
 * @throws {Error} If any required environment variable is missing
 */
export function getJiraEnv(): JiraEnv {
  const baseUrl = process.env.NEXT_PUBLIC_JIRA_BASE_URL;
  const email = process.env.JIRA_EMAIL;
  const apiToken = process.env.JIRA_API_TOKEN;

  if (!baseUrl || !email || !apiToken) {
    throw new Error("Missing required JIRA_* environment variables");
  }

  return { baseUrl, email, apiToken };
}

/**
 * Creates a Basic Auth header for Jira API requests
 */
export function createAuthHeader(env: JiraEnv): string {
  const credentials = `${env.email}:${env.apiToken}`;
  return `Basic ${Buffer.from(credentials).toString("base64")}`;
}

