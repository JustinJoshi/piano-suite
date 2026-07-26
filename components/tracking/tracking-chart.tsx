"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";

interface ChartPoint {
  attempt: number;
  seconds: number;
  ms: number;
  grade?: string | null;
  redo: boolean;
  date: Date;
  label: string;
}

interface TrackingChartProps {
  data: ChartPoint[];
  goodThreshold?: number;
  hardThreshold?: number;
  emptyMessage?: string;
}

const gradeColors: Record<string, string> = {
  Again: "#C1614A",
  Hard: "#E8CF7A",
  Good: "#7FA37A",
  Easy: "#6FA9A3",
};

const ungradedColor = "#5c5646";

function buildTicks(maxSeconds: number) {
  const niceMax = Math.ceil(maxSeconds * 1.15 * 2) / 2;
  const steps = 4;
  const ticks = [];
  for (let i = 0; i <= steps; i++) {
    ticks.push(Math.round(((niceMax * i) / steps) * 100) / 100);
  }
  return { niceMax, ticks };
}

interface DotRenderProps {
  cx?: number;
  cy?: number;
  payload?: ChartPoint;
}

function CustomDot(props: DotRenderProps) {
  const { cx, cy, payload } = props;
  if (cx == null || cy == null || !payload) return null;
  const color = payload.grade ? gradeColors[payload.grade] || ungradedColor : ungradedColor;
  if (payload.redo) {
    return (
      <circle
        cx={cx}
        cy={cy}
        r={5}
        fill="var(--color-bg-page, #0c0a08)"
        stroke={color}
        strokeWidth={2.2}
      />
    );
  }
  return (
    <circle
      cx={cx}
      cy={cy}
      r={5}
      fill={color}
      stroke="var(--color-bg-page, #0c0a08)"
      strokeWidth={1.5}
    />
  );
}

interface TooltipRenderProps {
  active?: boolean;
  payload?: Array<{ payload: ChartPoint; value: number }>;
}

function CustomTooltip({ active, payload }: TooltipRenderProps) {
  if (active && payload && payload.length) {
    const p = payload[0].payload;
    return (
      <div className="rounded-lg border border-border bg-popover px-3 py-2 text-xs shadow-md">
        <div className="font-medium text-popover-foreground">
          {p.label} · {p.seconds.toFixed(2)}s
        </div>
        <div className="text-muted-foreground">
          {p.grade || "ungraded"}
          {p.redo ? " · redo" : ""}
        </div>
        <div className="text-muted-foreground">
          {p.date.toLocaleDateString()} {p.date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
      </div>
    );
  }
  return null;
}

export function TrackingChart({
  data,
  goodThreshold = 2000,
  hardThreshold = 4000,
  emptyMessage = "No attempts logged yet.",
}: TrackingChartProps) {
  if (!data.length) {
    return (
      <div className="flex h-[320px] items-center justify-center rounded-xl border border-border bg-card p-6 text-sm text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  const maxSeconds = Math.max(...data.map((d) => d.seconds), 1);
  const { niceMax } = buildTicks(maxSeconds);
  const goodSec = goodThreshold / 1000;
  const hardSec = hardThreshold / 1000;

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 16, right: 16, bottom: 24, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,162,39,0.12)" />
          <XAxis
            dataKey="attempt"
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
            label={{
              value: `attempt № (chronological) — ${data.length} total`,
              position: "insideBottom",
              offset: -10,
              fill: "var(--color-muted-foreground)",
              fontSize: 11,
            }}
          />
          <YAxis
            domain={[0, niceMax]}
            tickFormatter={(v) => `${v.toFixed(1)}s`}
            tickLine={false}
            axisLine={false}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
            width={40}
          />
          <Tooltip content={<CustomTooltip />} cursor={{ stroke: "var(--color-muted-foreground)", strokeWidth: 1 }} />
          {goodSec <= niceMax && (
            <ReferenceLine
              y={goodSec}
              stroke="#7FA37A"
              strokeDasharray="4 3"
              strokeOpacity={0.55}
            />
          )}
          {hardSec <= niceMax && (
            <ReferenceLine
              y={hardSec}
              stroke="#E8CF7A"
              strokeDasharray="4 3"
              strokeOpacity={0.55}
            />
          )}
          <Line
            type="monotone"
            dataKey="seconds"
            stroke="rgba(201,162,39,0.5)"
            strokeWidth={1.5}
            dot={<CustomDot />}
            activeDot={{ r: 7 }}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
