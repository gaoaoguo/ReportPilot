import type { ColumnProfile, ColumnType, CsvRow } from "./types";

export function inferColumns(rows: CsvRow[], fields: string[]): ColumnProfile[] {
  return fields.map((field) => {
    const values = rows.map((row) => row[field] ?? "");
    const nonEmptyValues = values.filter((value) => value.trim() !== "");
    const uniqueValues = new Set(nonEmptyValues);
    const type = inferColumnType(nonEmptyValues);
    const numericValues = nonEmptyValues.map(Number).filter((value) => Number.isFinite(value));

    return {
      name: field,
      type,
      nullCount: values.length - nonEmptyValues.length,
      uniqueCount: uniqueValues.size,
      sampleValues: [...uniqueValues].slice(0, 5),
      ...(numericValues.length
        ? {
            min: Math.min(...numericValues),
            max: Math.max(...numericValues),
            average: numericValues.reduce((sum, value) => sum + value, 0) / numericValues.length
          }
        : {})
    };
  });
}

function inferColumnType(values: string[]): ColumnType {
  if (!values.length) {
    return "unknown";
  }

  const numberRatio = ratio(values, isNumberLike);
  const dateRatio = ratio(values, isDateLike);
  const booleanRatio = ratio(values, isBooleanLike);
  const uniqueRatio = new Set(values).size / values.length;
  const averageLength = values.reduce((sum, value) => sum + value.length, 0) / values.length;

  if (numberRatio >= 0.75) {
    return "number";
  }

  if (dateRatio >= 0.75) {
    return "date";
  }

  if (booleanRatio >= 0.75) {
    return "boolean";
  }

  if (uniqueRatio <= 0.6 && averageLength <= 40) {
    return "category";
  }

  if (averageLength > 12 || uniqueRatio > 0.6) {
    return "text";
  }

  return "unknown";
}

function ratio(values: string[], predicate: (value: string) => boolean) {
  return values.filter(predicate).length / values.length;
}

function isNumberLike(value: string) {
  return value.trim() !== "" && Number.isFinite(Number(value));
}

function isDateLike(value: string) {
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp);
}

function isBooleanLike(value: string) {
  return ["true", "false", "yes", "no", "1", "0", "是", "否"].includes(value.trim().toLowerCase());
}
