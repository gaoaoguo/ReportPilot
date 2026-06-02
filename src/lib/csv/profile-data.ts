import { inferColumns } from "./infer-columns";
import type { ColumnProfile, CsvRow } from "./types";

export function profileData(rows: CsvRow[], fields: string[]): ColumnProfile[] {
  return inferColumns(rows, fields);
}
