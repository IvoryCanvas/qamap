import { isAtLeastSeverity } from "./severity.js";
import type { Finding, ScanResult, Severity } from "./types.js";

const severityOrder: Severity[] = ["high", "medium", "low", "info"];

export function formatTextReport(result: ScanResult): string {
  const lines: string[] = [];
  lines.push(`${result.tool.name} ${result.tool.version}`);
  lines.push(`Root: ${result.root}`);
  lines.push(
    `Findings: ${result.findings.length} (${severityOrder
      .map((severity) => `${severity}: ${result.counts[severity]}`)
      .join(", ")})`,
  );

  if (result.findings.length === 0) {
    lines.push("");
    lines.push("No findings. Your repository has a clean first-pass CodeWard scan.");
    return lines.join("\n");
  }

  for (const severity of severityOrder) {
    const findings = result.findings.filter((finding) => finding.severity === severity);
    if (findings.length === 0) {
      continue;
    }

    lines.push("");
    lines.push(severity.toUpperCase());
    for (const finding of findings) {
      lines.push(`- ${finding.id} ${finding.title}${finding.file ? ` (${finding.file})` : ""}`);
      lines.push(`  ${finding.message}`);
      lines.push(`  Fix: ${finding.recommendation}`);
      if (finding.evidence) {
        lines.push(`  Evidence: ${finding.evidence}`);
      }
    }
  }

  return lines.join("\n");
}

export function formatMarkdownReport(result: ScanResult): string {
  const lines: string[] = [];
  lines.push("# CodeWard Report");
  lines.push("");
  lines.push(`Generated: ${result.scannedAt}`);
  lines.push(`Root: \`${result.root}\``);
  lines.push(`Files inspected: ${result.filesInspected}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push("| Severity | Count |");
  lines.push("| --- | ---: |");
  for (const severity of severityOrder) {
    lines.push(`| ${severity} | ${result.counts[severity]} |`);
  }
  lines.push("");

  if (result.findings.length === 0) {
    lines.push("No findings. Your repository has a clean first-pass CodeWard scan.");
    lines.push("");
    return lines.join("\n");
  }

  lines.push("## Findings");
  lines.push("");

  for (const finding of sortFindings(result.findings)) {
    lines.push(`### ${finding.id}: ${finding.title}`);
    lines.push("");
    lines.push(`- Severity: \`${finding.severity}\``);
    if (finding.file) {
      lines.push(`- File: \`${finding.file}\``);
    }
    lines.push(`- Message: ${finding.message}`);
    lines.push(`- Recommendation: ${finding.recommendation}`);
    if (finding.evidence) {
      lines.push(`- Evidence: \`${finding.evidence.replaceAll("`", "'")}\``);
    }
    lines.push("");
  }

  return lines.join("\n");
}

export function hasFindingsAtOrAbove(result: ScanResult, threshold: Severity): boolean {
  return result.findings.some((finding) => isAtLeastSeverity(finding.severity, threshold));
}

function sortFindings(findings: Finding[]): Finding[] {
  return [...findings].sort((left, right) => {
    const severityDelta = severityOrder.indexOf(left.severity) - severityOrder.indexOf(right.severity);
    if (severityDelta !== 0) {
      return severityDelta;
    }
    return left.id.localeCompare(right.id);
  });
}
