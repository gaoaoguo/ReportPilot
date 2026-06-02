import type { ColumnProfile, CsvRow, DataQualityIssue, DataQualitySummary } from "./types";

export function detectDataQualityIssues(
  rows: CsvRow[],
  columns: ColumnProfile[],
  options: {
    duplicateColumnNames?: string[];
  } = {}
): DataQualitySummary {
  const issues: DataQualityIssue[] = [];

  for (const field of options.duplicateColumnNames ?? []) {
    issues.push({
      code: "DUPLICATE_COLUMN_NAME",
      message: `字段「${field}」重复出现`,
      severity: "high",
      field
    });
  }

  if (hasDuplicateRows(rows)) {
    issues.push({
      code: "DUPLICATE_ROWS",
      message: "数据中存在重复行",
      severity: "medium"
    });
  }

  for (const column of columns) {
    if (column.nullCount > 0) {
      issues.push({
        code: "MISSING_VALUES",
        message: `字段「${column.name}」存在空值`,
        severity: "medium",
        field: column.name
      });
    }

    if (column.nullCount === rows.length) {
      issues.push({
        code: "EMPTY_COLUMN",
        message: `字段「${column.name}」为空列`,
        severity: "high",
        field: column.name
      });
    }

    if (column.type === "number" && hasMixedNumberText(rows, column.name)) {
      issues.push({
        code: "MIXED_NUMBER_TEXT",
        message: `字段「${column.name}」包含无法识别为数字的内容`,
        severity: "medium",
        field: column.name
      });
    }

    if (column.type === "date" && hasMixedDateText(rows, column.name)) {
      issues.push({
        code: "MIXED_DATE_FORMAT",
        message: `字段「${column.name}」包含无法识别为日期的内容`,
        severity: "medium",
        field: column.name
      });
    }

    if (rows.length > 0 && column.uniqueCount / rows.length >= 0.75) {
      issues.push({
        code: "HIGH_CARDINALITY",
        message: `字段「${column.name}」唯一值较多`,
        severity: "low",
        field: column.name
      });
    }

    if (/id$/i.test(column.name) || /编号|编码/.test(column.name)) {
      issues.push({
        code: "LIKELY_ID_FIELD",
        message: `字段「${column.name}」可能是 ID 字段`,
        severity: "low",
        field: column.name
      });
    }

    if (/amount|price|cost|金额|价格|费用/i.test(column.name)) {
      issues.push({
        code: "LIKELY_AMOUNT_FIELD",
        message: `字段「${column.name}」可能是金额字段`,
        severity: "low",
        field: column.name
      });
    }
  }

  return {
    score: calculateScore(issues),
    issues
  };
}

function hasDuplicateRows(rows: CsvRow[]) {
  const seen = new Set<string>();

  for (const row of rows) {
    const key = JSON.stringify(row);

    if (seen.has(key)) {
      return true;
    }

    seen.add(key);
  }

  return false;
}

function hasMixedNumberText(rows: CsvRow[], field: string) {
  return rows.some((row) => {
    const value = row[field]?.trim();
    return value && !Number.isFinite(Number(value));
  });
}

function hasMixedDateText(rows: CsvRow[], field: string) {
  return rows.some((row) => {
    const value = row[field]?.trim();
    return value && !Number.isFinite(Date.parse(value));
  });
}

function calculateScore(issues: DataQualityIssue[]) {
  const penalty = issues.reduce((sum, issue) => {
    if (issue.severity === "high") {
      return sum + 15;
    }

    if (issue.severity === "medium") {
      return sum + 8;
    }

    return sum + 3;
  }, 0);

  return Math.max(0, 100 - penalty);
}
