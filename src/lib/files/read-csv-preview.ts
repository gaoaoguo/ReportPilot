import { readFile } from "node:fs/promises";
import Papa from "papaparse";
import { resolveStoredUploadPath } from "@/lib/storage/local-storage";

export type CsvPreview = {
  fields: string[];
  rows: Record<string, string>[];
};

export async function readCsvPreview(storagePath: string, preview = 20): Promise<CsvPreview> {
  const csv = await readFile(resolveStoredUploadPath(storagePath), "utf8");
  const parsed = Papa.parse<Record<string, string>>(csv, {
    header: true,
    preview,
    skipEmptyLines: true
  });

  if (parsed.errors.length) {
    throw new Error("CSV_PREVIEW_FAILED");
  }

  return {
    fields: parsed.meta.fields ?? [],
    rows: parsed.data
  };
}
