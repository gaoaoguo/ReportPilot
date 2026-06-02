import { describe, expect, test } from "vitest";
import { parseCsvContent } from "./parse-csv";

describe("parseCsvContent", () => {
  test("parses rows, fields and duplicate headers", () => {
    const result = parseCsvContent("name,amount,name\nA,12,B\nA,12,B\n");

    expect(result.fields).toEqual(["name", "amount", "name_2"]);
    expect(result.rowCount).toBe(2);
    expect(result.columnCount).toBe(3);
    expect(result.duplicateColumnNames).toEqual(["name"]);
    expect(result.rows[0]).toEqual({ name: "A", amount: "12", name_2: "B" });
  });

  test("limits parsed rows", () => {
    const result = parseCsvContent("name\nA\nB\nC\n", { maxRows: 2 });

    expect(result.rowCount).toBe(2);
    expect(result.truncated).toBe(true);
  });
});
