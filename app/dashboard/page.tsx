import { ChartPieSimple } from "./components/pie-chart";
import { StatusLineChart } from "./components/line-chart";
import { TableJiraStatus } from "./components/jira-table";

type DefectStatusName =
    | "Blocked"
    | "Canceled"
    | "In Progress"
    | "Done"
    | "Ready to test"
    | "Reviewing"
    | "To Do";

type DefectSummaryResponse = {
    summary: Record<DefectStatusName, number>;
    total: number;
};

const DEFECT_STATUS_ORDER: readonly DefectStatusName[] = [
    "To Do",
    "In Progress",
    "Blocked",
    "Ready to test",
    "Reviewing",
    // "Done",
    // "Canceled",  
] as const;

const EXCLUDED_STATUSES_FOR_CHART: ReadonlySet<DefectStatusName> = new Set([
    "Canceled",
    "Done",
]);

const STATUS_TO_COLOR_MAP: Readonly<Record<DefectStatusName, string>> = {
    Blocked: "var(--chart-1)",
    "In Progress": "var(--chart-2)",
    "Ready to test": "var(--chart-3)",
    Reviewing: "var(--chart-4)",
    "To Do": "var(--chart-5)",
    Done: "var(--chart-3)", // reuse chart colors for completed states
    Canceled: "var(--chart-2)",
};

const BASE_URL =
    process.env.NODE_ENV !== "development" &&
        process.env.NEXT_PUBLIC_BASE_URL
        ? process.env.NEXT_PUBLIC_BASE_URL
        : "http://localhost:3000";

async function fetchDefectSummary(): Promise<DefectSummaryResponse> {
    const params = new URLSearchParams();
    DEFECT_STATUS_ORDER.forEach((status) => {
        params.append("status", status);
    });

    const response = await fetch(`${BASE_URL}/api/defect/query?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        // Always fetch fresh data; adjust if you want caching
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch defect summary: ${response.statusText}`);
    }

    const json = (await response.json()) as unknown;

    // Narrow the JSON into the shape we expect
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

type DueSummaryResponse = {
    emptyDueDateTotal: number;
    todayDueDateTotal: number;
    delayedDueDateTotal: number;
    assigneeEmptyTotal: number;
};

async function fetchDueDateSummary(): Promise<DueSummaryResponse> {
    const params = new URLSearchParams();

    // We want to count across all statuses, so reuse the same order list.
    DEFECT_STATUS_ORDER.forEach((status) => {
        params.append("status", status);
    });

    // 1) duedate is EMPTY
    const emptyRes = await fetch(
        `${BASE_URL}/api/defect/query?${params.toString()}&jql=${encodeURIComponent(
            "duedate is EMPTY",
        )}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
        },
    );

    if (!emptyRes.ok) {
        throw new Error(`Failed to fetch empty duedate summary: ${emptyRes.statusText}`);
    }

    const emptyJson = (await emptyRes.json()) as DefectSummaryResponse;

    // 2) duedate = now()
    const nowRes = await fetch(
        `${BASE_URL}/api/defect/query?${params.toString()}&jql=${encodeURIComponent(
            "duedate = now()",
        )}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
        },
    );

    if (!nowRes.ok) {
        throw new Error(`Failed to fetch today duedate summary: ${nowRes.statusText}`);
    }

    const nowJson = (await nowRes.json()) as DefectSummaryResponse;

    // 3) duedate < now()
    const delayedRes = await fetch(
        `${BASE_URL}/api/defect/query?${params.toString()}&jql=${encodeURIComponent(
            "duedate < now()",
        )}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
        },
    );

    if (!delayedRes.ok) {
        throw new Error(`Failed to fetch before duedate summary: ${delayedRes.statusText}`);
    }

    const delayedJson = (await delayedRes.json()) as DefectSummaryResponse;

    // 4) assignee = EMPTY
    const assigneeEmptyRes = await fetch(
        `${BASE_URL}/api/defect/query?${params.toString()}&jql=${encodeURIComponent(
            "assignee = EMPTY",
        )}`,
        {
            method: "GET",
            headers: { "Content-Type": "application/json" },
            cache: "no-store",
        },
    );

    if (!assigneeEmptyRes.ok) {
        throw new Error(`Failed to fetch assignee empty summary: ${assigneeEmptyRes.statusText}`);
    }

    const assigneeEmptyJson = (await assigneeEmptyRes.json()) as DefectSummaryResponse;

    return {
        emptyDueDateTotal: emptyJson.total,
        todayDueDateTotal: nowJson.total,
        delayedDueDateTotal: delayedJson.total,
        assigneeEmptyTotal: assigneeEmptyJson.total,
    };
}

export default async function Page() {
    const [defectSummary, dueDateSummary] = await Promise.all([
        fetchDefectSummary(),
        fetchDueDateSummary(),
    ]);
    const chartData = Object.entries(defectSummary.summary)
        .filter(
            ([status]) =>
                !EXCLUDED_STATUSES_FOR_CHART.has(status as DefectStatusName),
        )
        .map(([status, amount]) => {
            const typedStatus = status as DefectStatusName;

            return {
                status: typedStatus,
                amount,
                fill: STATUS_TO_COLOR_MAP[typedStatus],
            };
        });

    return (
        <div className="flex flex-col gap-4">
            <div className="grid gap-4 md:grid-cols-2">
                <ChartPieSimple chartData={chartData} />
                <StatusLineChart />
            </div>
            <div className="grid gap-4">
                <TableJiraStatus
                    data={chartData}
                    dueDateSummary={dueDateSummary}
                    jiraBaseUrl={process.env.JIRA_BASE_URL || ""}
                />
            </div>

        </div>
    );
}