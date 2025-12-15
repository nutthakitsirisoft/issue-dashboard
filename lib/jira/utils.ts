/**
 * Jira utility functions
 */

import { STATUSES } from "@/lib/constants/jira";
import type { StatusKey } from "@/types";

/**
 * Formats a Date as yyyy-MM-dd in the server's local timezone
 * This ensures dates stay consistent regardless of timezone conversion
 */
export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Maps a Jira status to a status key
 */
export function mapStatusToKey(status: (typeof STATUSES)[number]): StatusKey {
  switch (status) {
    case "To Do":
      return "todo";
    case "In Progress":
      return "inProgress";
    case "Done":
      return "done";
  }
}

