#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { generateAgentContext } from "./context.js";
import { formatMarkdownReport, formatTextReport, hasFindingsAtOrAbove } from "./report.js";
import { scanProject } from "./scanner.js";
import { isSeverity } from "./severity.js";
import type { Severity } from "./types.js";
import { VERSION } from "./version.js";

interface ParsedOptions {
  path: string;
  json: boolean;
  output?: string;
  write?: string;
  force: boolean;
  failOn?: Severity;
  maxFiles?: number;
}

async function main(argv: string[]): Promise<number> {
  const [command, ...rest] = argv;

  if (!command || command === "--help" || command === "-h") {
    printHelp();
    return 0;
  }

  if (command === "--version" || command === "-v") {
    console.log(VERSION);
    return 0;
  }

  if (command === "scan") {
    const options = parseOptions(rest);
    const result = await scanProject(options.path, { maxFiles: options.maxFiles });
    console.log(options.json ? JSON.stringify(result, null, 2) : formatTextReport(result));
    return options.failOn && hasFindingsAtOrAbove(result, options.failOn) ? 1 : 0;
  }

  if (command === "report") {
    const options = parseOptions(rest);
    const result = await scanProject(options.path, { maxFiles: options.maxFiles });
    const markdown = formatMarkdownReport(result);
    if (options.output) {
      const outputPath = path.resolve(options.output);
      await fs.writeFile(outputPath, markdown, "utf8");
      console.log(`Wrote ${outputPath}`);
    } else {
      console.log(markdown);
    }
    return options.failOn && hasFindingsAtOrAbove(result, options.failOn) ? 1 : 0;
  }

  if (command === "context") {
    const options = parseOptions(rest);
    const context = await generateAgentContext(options.path);
    if (options.write) {
      const outputPath = path.resolve(options.path, options.write);
      if (!options.force) {
        try {
          await fs.access(outputPath);
          throw new Error(`Refusing to overwrite ${outputPath}. Pass --force to replace it.`);
        } catch (error) {
          if (error instanceof Error && error.message.startsWith("Refusing")) {
            throw error;
          }
        }
      }
      await fs.writeFile(outputPath, context, "utf8");
      console.log(`Wrote ${outputPath}`);
    } else {
      console.log(context);
    }
    return 0;
  }

  throw new Error(`Unknown command: ${command}`);
}

function parseOptions(args: string[]): ParsedOptions {
  const options: ParsedOptions = {
    path: ".",
    json: false,
    force: false,
  };

  let sawPath = false;
  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--json") {
      options.json = true;
      continue;
    }

    if (arg === "--force") {
      options.force = true;
      continue;
    }

    if (arg === "--output" || arg === "-o") {
      options.output = readValue(args, ++index, arg);
      continue;
    }

    if (arg === "--write") {
      const next = args[index + 1];
      if (next && !next.startsWith("-")) {
        options.write = next;
        index += 1;
      } else {
        options.write = "AGENTS.md";
      }
      continue;
    }

    if (arg === "--fail-on") {
      const value = readValue(args, ++index, arg);
      if (!isSeverity(value)) {
        throw new Error(`Invalid severity for --fail-on: ${value}`);
      }
      options.failOn = value;
      continue;
    }

    if (arg === "--max-files") {
      const value = Number.parseInt(readValue(args, ++index, arg), 10);
      if (!Number.isFinite(value) || value < 1) {
        throw new Error("--max-files must be a positive integer");
      }
      options.maxFiles = value;
      continue;
    }

    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }

    if (arg.startsWith("-")) {
      throw new Error(`Unknown option: ${arg}`);
    }

    if (sawPath) {
      throw new Error(`Unexpected argument: ${arg}`);
    }

    options.path = arg;
    sawPath = true;
  }

  return options;
}

function readValue(args: string[], index: number, flag: string): string {
  const value = args[index];
  if (!value || value.startsWith("-")) {
    throw new Error(`Missing value for ${flag}`);
  }
  return value;
}

function printHelp(): void {
  console.log(`CodeWard ${VERSION}

Guardrails for AI coding agents and the code they change.

Usage:
  codeward scan [path] [--json] [--fail-on <severity>] [--max-files <n>]
  codeward report [path] [--output <file>] [--fail-on <severity>]
  codeward context [path] [--write [file]] [--force]

Severities:
  info, low, medium, high

Examples:
  codeward scan .
  codeward scan . --fail-on medium
  codeward report . --output CODEWARD_REPORT.md
  codeward context . --write AGENTS.md
`);
}

main(process.argv.slice(2))
  .then((code) => {
    process.exitCode = code;
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`CodeWard error: ${message}`);
    process.exitCode = 1;
  });
