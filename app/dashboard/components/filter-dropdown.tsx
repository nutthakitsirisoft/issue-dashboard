"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuLabel,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { FilterDropdownMenuProps } from "@/types";

/**
 * Dropdown menu component for filtering defects by type
 * Allows users to filter by: All, Bug, or Task
 */
export function FilterDropdownMenu({ value, onValueChange }: Readonly<FilterDropdownMenuProps>) {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="outline">Filter by {value}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {/* Radio group for selecting filter type */}
                <DropdownMenuRadioGroup value={value} onValueChange={onValueChange}>
                    <DropdownMenuRadioItem value="All">All</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Bug">Bug</DropdownMenuRadioItem>
                    <DropdownMenuRadioItem value="Task">Task</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
