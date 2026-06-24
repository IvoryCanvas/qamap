import { severities, type Severity } from "./types.js";

const severityRank = new Map<Severity, number>(
  severities.map((severity, index) => [severity, index]),
);

export function isSeverity(value: string): value is Severity {
  return severityRank.has(value as Severity);
}

export function isAtLeastSeverity(actual: Severity, threshold: Severity): boolean {
  return (severityRank.get(actual) ?? 0) >= (severityRank.get(threshold) ?? 0);
}
