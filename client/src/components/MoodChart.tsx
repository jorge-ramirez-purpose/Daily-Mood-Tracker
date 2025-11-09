import { useMemo } from "react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import { MOODS, type MoodKey } from "../constants/moods";
import type { AggregatedRow } from "../utils/data";

type StackedBarDatum = {
  month: string;
} & Record<MoodKey, number>;

const toStackedBarData = (yearData: AggregatedRow[]): StackedBarDatum[] =>
  yearData.map((row) => ({
    month: row.month,
    ...MOODS.reduce<Record<MoodKey, number>>((acc, mood) => {
      acc[mood.key] = row[mood.key];
      return acc;
    }, {} as Record<MoodKey, number>),
  }));

type MoodChartProps = {
  data: AggregatedRow[];
};

export const MoodChart = ({ data }: MoodChartProps) => {
  const chartData = useMemo(() => toStackedBarData(data), [data]);

  return (
    <div className="chart">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} stackOffset="expand" margin={{ top: 10, right: 20, bottom: 0, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="month" />
          <YAxis tickFormatter={(value) => `${Math.round(value * 100)}%`} />
          <Tooltip formatter={(value, name) => [value, name]} />
          <Legend />
          {MOODS.map((mood) => (
            <Bar key={mood.key} dataKey={mood.key} stackId="mood" fill={mood.color} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
