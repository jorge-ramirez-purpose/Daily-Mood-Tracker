import { useMemo } from "react";
import { ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Bar } from "recharts";
import { MOODS } from "../constants/moods.js";

const toStackedBarData = (yearData) =>
  yearData.map((row) => ({
    month: row.month,
    ...Object.fromEntries(MOODS.map((mood) => [mood.key, row[mood.key]])),
  }));

export const MoodChart = ({ data }) => {
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

export default MoodChart;
