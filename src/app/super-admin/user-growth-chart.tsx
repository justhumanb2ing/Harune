"use client";

import { format, parseISO } from "date-fns";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { DailyStats } from "./page-client";

interface UserGrowthChartProps {
  data: DailyStats[];
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="date" tickFormatter={(date: string) => format(parseISO(date), "MMM dd")} />
        <YAxis />
        <Tooltip
          labelFormatter={(label) => {
            if (typeof label !== "string") return label;
            return format(parseISO(label), "MMM dd, yyyy");
          }}
        />
        <Legend />
        <Line type="monotone" dataKey="users" stroke="#8884d8" name="New Users" />
        <Line type="monotone" dataKey="waitlist" stroke="#82ca9d" name="Waitlist Entries" />
      </LineChart>
    </ResponsiveContainer>
  );
}
