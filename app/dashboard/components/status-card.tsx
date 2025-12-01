import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export interface StatusCardProps {
  statusName: string;
  statusCount: number;
  isFocused?: boolean;
}

export function StatusCard({
  statusName,
  statusCount,
  isFocused = false,
}: StatusCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardDescription className="flex justify-between gap-2">
          <p>{statusName}</p>
          {isFocused ? <Badge variant="destructive">Focused</Badge> : null}
        </CardDescription>
        <CardTitle className="text-xl font-semibold tabular-nums @[250px]/card:text-3xl">
          {statusCount}
        </CardTitle>
        <CardAction />
      </CardHeader>
    </Card>
  );
}