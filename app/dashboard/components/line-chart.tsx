"use client";

import * as React from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    XAxis,
    YAxis,
} from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    ChartConfig,
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart";

const chartConfig: ChartConfig = {
    todo: {
        label: "To Do",
        color: "var(--chart-5)",
    },
    inProgress: {
        label: "In Progress",
        color: "var(--chart-2)",
    },
    done: {
        label: "Done",
        color: "var(--chart-3)",
    },
};

type ApiDaySummary = {
    date: string;
    todo: number;
    inProgress: number;
    done: number;
};

type LineChartPoint = {
    date: string;
    todo: number;
    inProgress: number;
    done: number;
};

const BASE_URL =
    globalThis.window?.location.origin ??
    process.env.NEXT_PUBLIC_BASE_URL ??
    "http://localhost:3000";

async function fetchLast7Days(typeFilter: string): Promise<LineChartPoint[]> {
    const params = new URLSearchParams();
    params.append("type", typeFilter);

    const res = await fetch(`${BASE_URL}/api/defect/summary-7-days?${params.toString()}`, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error("Failed to fetch 7-day defect summary");
    }

    const json = (await res.json()) as { days?: ApiDaySummary[] };

    if (!json.days || !Array.isArray(json.days)) {
        return [];
    }

    return json.days.map((day) => {
        const dateObj = new Date(day.date);
        const label = dateObj.toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "2-digit",
        });

        return {
            date: label,
            todo: day.todo,
            inProgress: day.inProgress,
            done: day.done,
        };
    });
}

type StatusLineChartProps = {
    readonly typeFilter: string;
};

export function StatusLineChart({ typeFilter }: StatusLineChartProps) {
    const [data, setData] = React.useState<LineChartPoint[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let cancelled = false;

        setLoading(true);
        setError(null);

        fetchLast7Days(typeFilter)
            .then((points) => {
                if (!cancelled) {
                    setData(points);
                    setLoading(false);
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    console.error("Error loading 7-day line chart data:", err);
                    setError(err instanceof Error ? err.message : "Failed to load data");
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [typeFilter]);

    if (loading) {
        return (
            <Card className="flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle>Last 7 Days</CardTitle>
                    <CardDescription>
                        Daily status counts (To Do, In Progress, Done)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-[260px] items-center justify-center">
                        <p className="text-muted-foreground">Loading...</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card className="flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle>Last 7 Days</CardTitle>
                    <CardDescription>
                        Daily status counts (To Do, In Progress, Done)
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex h-[260px] items-center justify-center">
                        <p className="text-red-500">Error: {error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="flex flex-col">
            <CardHeader className="pb-2">
                <CardTitle>Last 7 Days</CardTitle>
                <CardDescription>
                    Daily status counts (To Do, In Progress, Done)
                </CardDescription>
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={chartConfig}
                    className="h-[260px] w-full"
                >
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis allowDecimals={false} />
                        <ChartTooltip
                            content={<ChartTooltipContent />}
                        />
                        <ChartLegend
                            content={<ChartLegendContent />}
                        />
                        <Line
                            type="monotone"
                            dataKey="todo"
                            stroke="var(--color-todo)"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            name="To Do"
                        />
                        <Line
                            type="monotone"
                            dataKey="inProgress"
                            stroke="var(--color-inProgress)"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            name="In Progress"
                        />
                        <Line
                            type="monotone"
                            dataKey="done"
                            stroke="var(--color-done)"
                            strokeWidth={2}
                            dot={{ r: 3 }}
                            activeDot={{ r: 5 }}
                            name="Done"
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    );
}


