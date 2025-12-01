import { StatusCard } from "./components/status-card";
import { ChartPieSimple } from "./components/pie-chart";
import { StatusLineChart } from "./components/line-chart";

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
    "Done",
    "Canceled",
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

    const response = await fetch(`${BASE_URL}/api/defect/today?${params.toString()}`, {
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

export default async function Page() {
    const defectSummary = await fetchDefectSummary();
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
            {/* <div className="flex gap-2 items-center">
                <Button variant="outline" >
                    Bug
                </Button>
                <Button variant="outline" >
                    Task
                </Button>
            </div> */}
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {DEFECT_STATUS_ORDER.map((status) => (
                    <StatusCard
                        key={status}
                        statusName={status}
                        statusCount={defectSummary.summary[status]}
                        isFocused={status === "Blocked"}
                    />
                ))}
                <StatusCard statusName="Total" statusCount={defectSummary.total} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
                <ChartPieSimple chartData={chartData} />
                <StatusLineChart />
            </div>
        </div>
    );
}