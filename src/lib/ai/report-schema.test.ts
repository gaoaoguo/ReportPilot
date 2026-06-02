import { describe, expect, test } from "vitest";
import { parseReportInsightJson } from "./report-schema";

const validJson = JSON.stringify({
  title: "销售数据分析报告",
  summary: "销售额整体稳定，华东区域贡献较高。",
  dataQuality: {
    score: 82,
    issues: [
      {
        severity: "medium",
        message: "amount 字段存在少量空值"
      }
    ]
  },
  insights: [
    {
      title: "华东区域表现突出",
      description: "华东区域订单量高于其他区域。",
      severity: "info"
    }
  ],
  recommendedCharts: [
    {
      title: "区域销售额",
      type: "bar",
      xField: "region",
      yField: "amount",
      reason: "对比各区域销售额"
    }
  ],
  nextActions: ["优先检查 amount 字段空值"]
});

describe("report schema", () => {
  test("parses valid DeepSeek JSON output", () => {
    const report = parseReportInsightJson(validJson, ["region", "amount"]);

    expect(report.summary).toContain("销售额");
    expect(report.dataQuality.score).toBe(82);
    expect(report.recommendedCharts[0]?.xField).toBe("region");
  });

  test("rejects recommended chart fields that do not exist", () => {
    const content = validJson.replace('"amount"', '"not_exist"');

    expect(() => parseReportInsightJson(content, ["region", "amount"])).toThrow("推荐图表字段不存在");
  });
});
