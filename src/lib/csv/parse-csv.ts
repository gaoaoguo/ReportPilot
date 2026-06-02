import Papa from "papaparse";
import type { CsvRow } from "./types";

export type ParseCsvOptions = {
  maxRows?: number;
};

export type ParseCsvResult = {
  fields: string[];
  rows: CsvRow[];
  rowCount: number;
  columnCount: number;
  duplicateColumnNames: string[];
  truncated: boolean;
};

export function parseCsvContent(content: string, options: ParseCsvOptions = {}): ParseCsvResult {
  const parsed = Papa.parse<string[]>(content, {
    header: false,
    skipEmptyLines: true
  });

  const fatalErrors = parsed.errors.filter((error) => error.code !== "UndetectableDelimiter");

  if (fatalErrors.length) {
    throw new Error("CSV_PARSE_FAILED");
  }

  const [rawHeader, ...rawRows] = parsed.data;

  if (!rawHeader?.length) {
    throw new Error("CSV_HEADER_MISSING");
  }

  const duplicateColumnNames = findDuplicateColumnNames(rawHeader);
  const fields = buildUniqueFields(rawHeader);
  const maxRows = options.maxRows ?? rawRows.length;
  const limitedRows = rawRows.slice(0, maxRows);
  const rows = limitedRows.map((rawRow) => {
    return fields.reduce<CsvRow>((row, field, index) => {
      row[field] = String(rawRow[index] ?? "").trim();
      return row;
    }, {});
  });

  return {
    fields,
    rows,
    rowCount: rows.length,
    columnCount: fields.length,
    duplicateColumnNames,
    truncated: rawRows.length > rows.length
  };
}

function buildUniqueFields(rawHeader: string[]) {
  const seen = new Map<string, number>();

  return rawHeader.map((rawField, index) => {
    const baseName = String(rawField || `column_${index + 1}`).trim() || `column_${index + 1}`;
    const count = (seen.get(baseName) ?? 0) + 1;
    seen.set(baseName, count);

    return count === 1 ? baseName : `${baseName}_${count}`;
  });
}

function findDuplicateColumnNames(rawHeader: string[]) {
  const counts = new Map<string, number>();

  for (const field of rawHeader) {
    const key = String(field).trim();

    if (!key) {
      continue;
    }

    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()].filter(([, count]) => count > 1).map(([field]) => field);
}
