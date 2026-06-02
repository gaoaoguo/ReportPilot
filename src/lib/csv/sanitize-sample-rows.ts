import type { CsvRow } from "./types";

const sensitiveFieldPattern = /email|phone|mobile|tel|address|身份证|手机号|电话|邮箱|地址/i;

export function sanitizeSampleRows(rows: CsvRow[], limit = 20): CsvRow[] {
  return rows.slice(0, limit).map((row) => {
    return Object.fromEntries(
      Object.entries(row).map(([field, value]) => {
        if (sensitiveFieldPattern.test(field)) {
          return [field, "[已脱敏]"];
        }

        return [field, maskSensitiveValue(value)];
      })
    );
  });
}

function maskSensitiveValue(value: string) {
  if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
    return "[已脱敏]";
  }

  if (/^1\d{10}$/.test(value)) {
    return "[已脱敏]";
  }

  return value;
}
