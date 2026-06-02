import { describe, expect, test } from "vitest";
import { inferColumns } from "./infer-columns";
import { profileData } from "./profile-data";
import { detectDataQualityIssues } from "./detect-data-quality-issues";

const rows = [
  { amount: "12.5", createdAt: "2026-01-01", active: "true", region: "华东", note: "first order", customerId: "C001" },
  { amount: "18", createdAt: "2026-01-02", active: "false", region: "华南", note: "second order", customerId: "C002" },
  { amount: "text", createdAt: "not a date", active: "", region: "华东", note: "third order with long text", customerId: "C003" },
  { amount: "18", createdAt: "2026-01-02", active: "false", region: "华南", note: "second order", customerId: "C002" }
];

describe("csv profiling", () => {
  test("infers stable column types", () => {
    const columns = inferColumns(rows, ["amount", "createdAt", "active", "region", "note", "customerId"]);

    expect(columns.find((column) => column.name === "amount")?.type).toBe("number");
    expect(columns.find((column) => column.name === "createdAt")?.type).toBe("date");
    expect(columns.find((column) => column.name === "active")?.type).toBe("boolean");
    expect(columns.find((column) => column.name === "region")?.type).toBe("category");
    expect(columns.find((column) => column.name === "note")?.type).toBe("text");
  });

  test("profiles rows and reports quality issues", () => {
    const fields = ["amount", "createdAt", "active", "region", "note", "customerId", "empty"];
    const rowsWithEmptyColumn = rows.map((row) => ({ ...row, empty: "" }));
    const columns = profileData(rowsWithEmptyColumn, fields);
    const quality = detectDataQualityIssues(rowsWithEmptyColumn, columns, {
      duplicateColumnNames: ["amount"]
    });

    expect(columns.find((column) => column.name === "amount")?.nullCount).toBe(0);
    expect(columns.find((column) => column.name === "active")?.nullCount).toBe(1);
    expect(quality.score).toBeLessThan(100);
    expect(quality.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining(["DUPLICATE_ROWS", "EMPTY_COLUMN", "DUPLICATE_COLUMN_NAME", "MIXED_NUMBER_TEXT", "HIGH_CARDINALITY"])
    );
  });
});
