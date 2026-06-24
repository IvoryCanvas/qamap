export const severities = ["info", "low", "medium", "high"] as const;

export type Severity = (typeof severities)[number];

export interface Finding {
  id: string;
  title: string;
  severity: Severity;
  message: string;
  recommendation: string;
  file?: string;
  evidence?: string;
}

export interface ScanCounts {
  info: number;
  low: number;
  medium: number;
  high: number;
}

export interface ScanResult {
  tool: {
    name: string;
    version: string;
  };
  root: string;
  scannedAt: string;
  filesInspected: number;
  findings: Finding[];
  counts: ScanCounts;
}

export interface ScanOptions {
  maxFiles?: number;
}

export interface ProjectFile {
  path: string;
  absolutePath: string;
  size: number;
  text?: string;
}
