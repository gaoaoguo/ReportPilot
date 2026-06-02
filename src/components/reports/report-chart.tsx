"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import type { ChartDatum, ReportChartView } from "@/lib/reports/report-view-model";

const chartColors = ["#0f172a", "#2563eb", "#16a34a", "#ca8a04", "#dc2626", "#7c3aed", "#0891b2", "#475569"];

export function ReportChart({ chart, data }: { chart: ReportChartView; data: ChartDatum[] }) {
  if (!data.length) {
    return <p className="px-5 py-8 text-sm text-slate-600">当前文件预览数据不足，暂时无法绘制这个图表。</p>;
  }

  if (chart.type === "table") {
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500">
            <tr>
              <th className="px-4 py-3 font-medium">{chart.xField}</th>
              <th className="px-4 py-3 font-medium">{chart.yField ?? "数量"}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
              <tr key={item.name}>
                <td className="px-4 py-3 font-medium">{item.name}</td>
                <td className="px-4 py-3 text-slate-600">{item.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="h-72 px-3 py-4">
      <ResponsiveContainer height="100%" width="100%">
        {chart.type === "pie" ? (
          <PieChart>
            <Tooltip />
            <Pie data={data} dataKey="value" innerRadius={58} nameKey="name" outerRadius={96}>
              {data.map((item, index) => (
                <Cell fill={chartColors[index % chartColors.length]} key={item.name} />
              ))}
            </Pie>
          </PieChart>
        ) : chart.type === "line" ? (
          <LineChart data={data}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Line dataKey="value" stroke="#2563eb" strokeWidth={2} type="monotone" />
          </LineChart>
        ) : (
          <BarChart data={data}>
            <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" />
            <XAxis dataKey="name" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="value" fill="#0f172a" radius={[4, 4, 0, 0]} />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}
