"use client";

import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { AlertCircle } from "lucide-react";

// This type matches the shape of the `chartData` you build in `page.tsx`
export type DefectChartRow = {
    status: string;
    amount: number;
    fill: string;
};

type DueDateSummary = {
    emptyDueDateTotal: number;
    todayDueDateTotal: number;
    delayedDueDateTotal: number;
    assigneeEmptyTotal: number;
};

type TableJiraStatusProps = {
    readonly data: readonly DefectChartRow[];
    readonly dueDateSummary?: DueDateSummary;
    readonly jiraBaseUrl: string;
};

const PROJECT_KEY = "S2SWFE";
const ISSUE_TYPE = "Bug";

// Escape status for JQL
function escapeJql(status: string): string {
    const escaped = status.replaceAll('"', String.raw`\"`);
    return `"${escaped}"`;
}

// Build base JQL query
function buildBaseJql(status?: string): string {
    let jql = `project = "${PROJECT_KEY}" AND type = ${ISSUE_TYPE}`;
    if (status) {
        jql += ` AND status = ${escapeJql(status)}`;
    }
    return jql;
}

// Build JIRA search URL
function buildJiraSearchUrl(baseUrl: string, jql: string): string {
    const encodedJql = encodeURIComponent(jql);
    return `${baseUrl}/issues/?jql=${encodedJql}`;
}

export function TableJiraStatus({ data, dueDateSummary, jiraBaseUrl }: TableJiraStatusProps) {
    // Build JQL for due date summary rows (includes all statuses from DEFECT_STATUS_ORDER)
    const statuses = data.map((row) => row.status);
    const statusJql = statuses.map((status) => `status = ${escapeJql(status)}`).join(" OR ");
    const baseJqlWithStatuses = `${buildBaseJql()} AND (${statusJql})`;

    const handleRowClick = (jql: string) => {
        const url = buildJiraSearchUrl(jiraBaseUrl, jql);
        window.open(url, "_blank", "noopener,noreferrer");
    };

    return (
        <div className="flex flex-row gap-6">
            {dueDateSummary && (
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[180px]">Focused Summary</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                                const jql = `${baseJqlWithStatuses} AND (duedate is EMPTY)`;
                                handleRowClick(jql);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    const jql = `${baseJqlWithStatuses} AND (duedate is EMPTY)`;
                                    handleRowClick(jql);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            <TableCell className="font-medium">
                                <AlertCircle className="inline-block h-4 w-4 mr-2 text-red-500 align-middle" />
                                <span className="align-middle">No Due Date</span>
                            </TableCell>
                            <TableCell className="text-right">{dueDateSummary.emptyDueDateTotal}</TableCell>
                        </TableRow>
                        <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                                const jql = `${baseJqlWithStatuses} AND (duedate = now())`;
                                handleRowClick(jql);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    const jql = `${baseJqlWithStatuses} AND (duedate = now())`;
                                    handleRowClick(jql);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            <TableCell className="font-medium">
                                <AlertCircle className="inline-block h-4 w-4 mr-2 text-red-500 align-middle" />
                                <span className="align-middle">Due Today</span>
                            </TableCell>
                            <TableCell className="text-right">{dueDateSummary.todayDueDateTotal}</TableCell>
                        </TableRow>
                        <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                                const jql = `${baseJqlWithStatuses} AND (duedate < now())`;
                                handleRowClick(jql);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    const jql = `${baseJqlWithStatuses} AND (duedate < now())`;
                                    handleRowClick(jql);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            <TableCell className="font-medium">
                                <AlertCircle className="inline-block h-4 w-4 mr-2 text-red-500 align-middle" />
                                <span className="align-middle">Delayed</span>
                            </TableCell>
                            <TableCell className="text-right">{dueDateSummary.delayedDueDateTotal}</TableCell>
                        </TableRow>
                        <TableRow
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => {
                                const jql = `${baseJqlWithStatuses} AND (assignee = EMPTY)`;
                                handleRowClick(jql);
                            }}
                            onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                    e.preventDefault();
                                    const jql = `${baseJqlWithStatuses} AND (assignee = EMPTY)`;
                                    handleRowClick(jql);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                        >
                            <TableCell className="font-medium">
                                <AlertCircle className="inline-block h-4 w-4 mr-2 text-red-500 align-middle" />
                                <span className="align-middle">No Assignee</span>
                            </TableCell>
                            <TableCell className="text-right">{dueDateSummary.assigneeEmptyTotal}</TableCell>
                        </TableRow>
                    </TableBody>
                </Table>
            )}
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[180px]">Status</TableHead>
                        <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => {
                        const jql = buildBaseJql(row.status);
                        return (
                            <TableRow
                                key={row.status}
                                className="cursor-pointer hover:bg-muted/50"
                                onClick={() => handleRowClick(jql)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        handleRowClick(jql);
                                    }
                                }}
                                role="button"
                                tabIndex={0}
                            >
                                <TableCell className="font-medium">
                                    <span
                                        className="inline-block h-3 w-3 rounded-full mr-2 align-middle"
                                        style={{ backgroundColor: row.fill }}
                                    />
                                    <span className="align-middle">{row.status}</span>
                                </TableCell>
                                <TableCell className="text-right">{row.amount}</TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
