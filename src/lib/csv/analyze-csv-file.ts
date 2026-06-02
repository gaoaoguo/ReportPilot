import { readFile } from "node:fs/promises";
import { detectDataQualityIssues } from "./detect-data-quality-issues";
import { parseCsvContent } from "./parse-csv";
import { profileData } from "./profile-data";
import { sanitizeSampleRows } from "./sanitize-sample-rows";
import { resolveStoredUploadPath } from "@/lib/storage/local-storage";

export type CsvAnalysisResult = {
  previewJson: {
    fields: string[];
    rows: Record<string, string>[];
  };
  rowCount: number;
  columnCount: number;
  columnProfileJson: ReturnType<typeof profileData>;
  dataQualityJson: ReturnType<typeof detectDataQualityIssues> & {
    duplicateColumnNames: string[];
    truncated: boolean;
  };
};

export async function analyzeCsvFile(storagePath: string): Promise<CsvAnalysisResult> {
  const content = await readFile(resolveStoredUploadPath(storagePath), "utf8");
  const parsed = parseCsvContent(content, {
    maxRows: getMaxRowsPerFile()
  });
  const columns = profileData(parsed.rows, parsed.fields);
  const quality = detectDataQualityIssues(parsed.rows, columns, {
    duplicateColumnNames: parsed.duplicateColumnNames
  });

  return {
    previewJson: {
      fields: parsed.fields,
      rows: sanitizeSampleRows(parsed.rows, 20)
    },
    rowCount: parsed.rowCount,
    columnCount: parsed.columnCount,
    columnProfileJson: columns,
    dataQualityJson: {
      ...quality,
      duplicateColumnNames: parsed.duplicateColumnNames,
      truncated: parsed.truncated
    }
  };
}

function getMaxRowsPerFile() {
  const parsed = Number(process.env.FREE_MAX_ROWS_PER_FILE ?? "5000");
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 5000;
}
