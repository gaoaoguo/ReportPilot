export type CsvRow = Record<string, string>;

export type ColumnType = "number" | "date" | "boolean" | "category" | "text" | "unknown";

export type ColumnProfile = {
  name: string;
  type: ColumnType;
  nullCount: number;
  uniqueCount: number;
  sampleValues: string[];
  min?: number;
  max?: number;
  average?: number;
};

export type DataQualityIssue = {
  code: string;
  message: string;
  severity: "low" | "medium" | "high";
  field?: string;
};

export type DataQualitySummary = {
  score: number;
  issues: DataQualityIssue[];
};
