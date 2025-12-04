"use client";

import * as React from "react";
import { Pie, PieChart } from "recharts";

import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A simple pie chart"

const chartConfig: ChartConfig = {
    amount: {
        label: "Amount",
    },
    blocked: {
        label: "Blocked",
        color: "var(--chart-1)",
    },
    "to-do": {
        label: "To Do",
        color: "var(--chart-5)",
    },
    "in-progress": {
        label: "In Progress",
        color: "var(--chart-2)",
    },
    "ready-to-test": {
        label: "Ready to test",
        color: "var(--chart-3)",
    },
    reviewing: {
        label: "Reviewing",
        color: "var(--chart-4)",
    },
};

export type ChartPieData = {
    readonly status: string;
    readonly amount: number;
    readonly fill: string;
};

type ChartPieSimpleProps = {
    readonly chartData: readonly ChartPieData[];
    readonly loading?: boolean;
};

export function ChartPieSimple({ chartData, loading = false }: ChartPieSimpleProps) {
    if (loading) {
        return (
            <Card className="flex flex-col">
                <CardHeader className="items-center pb-0">
                    <CardTitle>Pie Chart</CardTitle>
                    <CardDescription>
                        Status Jira {new Date().toLocaleDateString("en-GB")}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col gap-4 pb-0 md:flex-row md:items-center">
                    <div className="flex flex-1 items-center justify-center">
                        <div className="mx-auto aspect-square max-h-[250px] flex items-center justify-center">
                            <p className="text-muted-foreground">Loading...</p>
                        </div>
                    </div>
                </CardContent>
                <CardFooter className="flex-col gap-2 text-sm" />
            </Card>
        );
    }

    return (
        <Card className="flex flex-col">
            <CardHeader className="items-center pb-0">
                <CardTitle>Pie Chart</CardTitle>
                <CardDescription>
                    Status Jira {new Date().toLocaleDateString("en-GB")}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-4 pb-0 md:flex-row md:items-center">
                <div className="flex-1">
                    <ChartContainer
                        config={chartConfig}
                        className="mx-auto aspect-square max-h-[250px]"
                    >
                        <PieChart>
                            <ChartTooltip
                                cursor={false}
                                content={<ChartTooltipContent hideLabel />}
                            />
                            <Pie data={chartData as any[]} dataKey="amount" label nameKey="status" />
                        </PieChart>
                    </ChartContainer>
                </div>
                <div className="w-full space-y-2 text-xs md:w-1/3">
                    {Object.entries(chartConfig)
                        .filter(([key]) => key !== "amount")
                        .map(([key, config]) => {
                            const color =
                                "color" in config && typeof config.color === "string"
                                    ? config.color
                                    : undefined;

                            if (!color) return null;

                            return (
                                <div
                                    key={key}
                                    className="flex items-center justify-between gap-2"
                                >
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="h-3 w-3 rounded-full"
                                            style={{ backgroundColor: color }}
                                        />
                                        <span className="text-muted-foreground">
                                            {config.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            </CardContent>
            <CardFooter className="flex-col gap-2 text-sm" />
        </Card>
    );
}
