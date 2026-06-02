import { describe, expect, test } from "vitest";
import { buildChartData, normalizeReportCharts, normalizeReportInsights } from "./report-view-model";

describe("report view model", () => {
  test("normalizes report insight JSON without exposing raw JSON", () => {
    const result = normalizeReportInsights({
      insights: [
        {
          title: "区域增长",
          description: "华东区域增长明显",
          severity: "info"
        }
      ],
      nextActions: ["检查华东区域渠道"]
    });

    expect(result.items[0]?.title).toBe("区域增长");
    expect(result.nextActions).toEqual(["检查华东区域渠道"]);
  });

  test("builds aggregated chart data from report preview rows", () => {
    const charts = normalizeReportCharts([
      {
        title: "区域销售额",
        type: "bar",
        xField: "region",
        yField: "amount",
        reason: "比较区域销售额"
      }
    ]);
    const preview = {
      fields: ["region", "amount"],
      rows: [
        { region: "华东", amount: "10" },
        { region: "华东", amount: "15" },
        { region: "华南", amount: "8" }
      ]
    };

    const data = buildChartData(charts[0], preview);

    expect(data).toEqual([
      { name: "华东", value: 25 },
      { name: "华南", value: 8 }
    ]);
  });

  test("returns empty chart data when recommended fields are unavailable", () => {
    const chart = normalizeReportCharts([
      {
        title: "无效图表",
        type: "line",
        xField: "missing",
        yField: "amount",
        reason: "字段不存在"
      }
    ])[0];

    expect(
      buildChartData(chart, {
        fields: ["region", "amount"],
        rows: [{ region: "华东", amount: "10" }]
      })
    ).toEqual([]);
  });
});
