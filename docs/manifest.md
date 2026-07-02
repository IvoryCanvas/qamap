# Verification Manifest

`.codeward/manifest.yaml` is CodeWard's repo-local verification memory. It lets a team capture the product domains, flows, anchors, and checks that static analysis cannot reliably infer from code alone.

> **Important:** create the shared team baseline from the repository's default branch, after pulling the latest changes. CodeWard reads the current checkout and does not silently switch branches, so a manifest generated on a feature branch represents that feature branch rather than the team's default QA map.

The intended workflow for the first shared baseline is:

```sh
git switch main
git pull
codeward manifest init .
codeward manifest validate .
```

Then use the committed manifest from feature branches or PR branches:

```sh
codeward manifest explain . --base origin/main --head HEAD
codeward e2e draft . --base origin/main --head HEAD --dry-run
```

`manifest init` reads the current checkout on disk. It does not silently switch to the default branch, because changing a developer's branch or working tree would be surprising and unsafe. If the team wants the manifest to represent the default product baseline, run it from the default branch after pulling the latest changes.

During baseline generation, CodeWard also looks for repo-local context documents that often contain verification knowledge not visible in source files:

- `CONTEXT.md` and `CONTEXT-MAP.md`
- ADRs such as `docs/adr/*.md`
- goal documents such as `goals/*.md`
- agent instruction files such as `AGENTS.md` and project-local instruction folders
- QA, test, release, and runbook documents under `docs/`

These files are used as advisory bootstrap context. They can improve initial naming, validation command hints, and safety rules, but they are not treated as product truth until a human reviews the manifest.

## What It Solves

CodeWard cannot know every team's product priorities from file paths alone. The manifest turns repeated human review knowledge into durable repository context:

- which file paths belong to a product domain
- which routes, components, APIs, or tests anchor an important flow
- which success, failure, edge, contract, or visual checks matter for that flow
- which runner usually verifies the flow
- whether the entry came from CodeWard inference or human review

When a recommendation is wrong, edit the manifest path shown in CodeWard output. The next branch should get better recommendations without another explanation.

## Schema

Generated manifests include:

```yaml
$schema: https://raw.githubusercontent.com/IvoryCanvas/codeward/main/schema/codeward-manifest.schema.json
version: 1
```

The JSON Schema is shipped in the package at:

```txt
schema/codeward-manifest.schema.json
```

Editors that understand YAML schema comments or `$schema` fields can use this file for validation and completion.

## Context Sources

When context documents are present, generated manifests may include a `context` section:

```yaml
context:
  instructionFiles:
    - path: CONTEXT.md
      kind: context
      confidence: medium
      signals:
        - domain-language
    - path: docs/adr/checkout-flow.md
      kind: adr
      confidence: medium
      signals:
        - architecture-decision
    - path: AGENTS.md
      kind: agent-instruction
      confidence: medium
      signals:
        - validation-command
        - safety-rule
  validationCommands:
    - pnpm test
  safetyRules:
    - Never write generated E2E drafts into target repos during smoke tests; use /tmp outputs.
  source:
    kind: inferred
    confidence: medium
    from:
      - context-document-context
      - adr-context
      - agent-instruction-context
```

Use this section to understand which repo-local documents influenced the baseline. Keep the trust boundary clear:

- `CONTEXT.md`, ADRs, and goals can carry product language and intent.
- agent instructions and runbooks usually carry workflow, safety, and validation rules.
- instruction-derived context should start as `inferred` and should not override human-reviewed domains, flows, and checks.
- if a recommendation is wrong because a context document is stale, update the document or remove the stale context source from the manifest.

## Minimal Example

```yaml
$schema: https://raw.githubusercontent.com/IvoryCanvas/codeward/main/schema/codeward-manifest.schema.json
version: 1

domains:
  - id: campaign
    name: Campaign
    paths:
      - src/pages/campaign/**
    criticality: medium
    source:
      kind: declared
      confidence: high
      from:
        - product-qa

flows:
  - id: campaign-application-complete
    domain: campaign
    name: Campaign Application Complete
    entry:
      route: /campaign/official/applicationComplete
      source: declared
    runner: playwright
    anchors:
      - kind: route
        path: src/pages/campaign/official/applicationComplete.tsx
        route: /campaign/official/applicationComplete
        source: declared
        confidence: high
    checks:
      - id: happy-path
        title: Submit content URL successfully
        type: success
      - id: invalid-input
        title: Show validation error for invalid content URL
        type: failure
    source:
      kind: declared
      confidence: high
      from:
        - product-qa
```

## Fields

| Field | Purpose |
| --- | --- |
| `domains[].id` | Stable machine-readable product area id. |
| `domains[].name` | Human-facing product term used in reports and draft titles. |
| `domains[].paths` | Glob-like path patterns relative to the manifest root. |
| `domains[].criticality` | `low`, `medium`, or `high` attention signal. |
| `flows[].id` | Stable machine-readable flow id. |
| `flows[].domain` | Optional domain id that owns the flow. |
| `flows[].entry.route` | Route hint used by Playwright drafts when available. |
| `flows[].runner` | Preferred verification runner: `playwright`, `maestro`, or `manual`. |
| `flows[].anchors` | Matchable route, component, file, API, or test anchors. |
| `flows[].checks` | Required verification points that should shape E2E drafts. |
| `context.instructionFiles` | Advisory repo-local context sources used while bootstrapping the manifest. |
| `context.validationCommands` | Validation commands inferred from context documents. |
| `context.safetyRules` | Workflow or safety rules inferred from context documents, with token-like values redacted. |
| `source.kind` | `inferred` for CodeWard-generated entries or `declared` after human review. |
| `source.confidence` | `low`, `medium`, or `high` confidence in the entry. |
| `source.from` | Evidence sources such as `route-file`, `component-file`, `product-qa`, or `human-reviewed`. |

## Validate

Run:

```sh
codeward manifest validate .
```

The validator checks for:

- missing or unparsable manifests
- duplicate domain, flow, or check ids
- missing domain path patterns
- flow references to unknown domains
- flows without anchors or checks
- anchor paths that no longer exist
- duplicate anchors
- route hints that do not start with `/`
- missing or unusual `$schema` values
- low-confidence inferred entries that need human review
- stale context source paths and advisory instruction-derived context

`invalid` and `missing` exit with code `1`. `valid` and `needs-work` exit with code `0` so teams can adopt the manifest gradually before making it a hard CI gate.

## Explain

Run:

```sh
codeward manifest explain . --base origin/main --head HEAD
```

This command answers:

- which changed files matched manifest domains
- which flow anchors matched the branch
- which checks are now relevant
- why the match happened
- which manifest path to edit when the recommendation is wrong

## Draft Impact

When a matched manifest flow has an entry route and checks, `codeward e2e draft` promotes that flow ahead of heuristic candidates. The generated draft includes:

- `source: verification-manifest` in JSON output
- the manifest route as a Playwright entrypoint when supported
- manifest checks as draft steps and coverage notes
- manifest evidence comments inside generated files
- promotion guidance that treats strong manifest matches as commit candidates

This keeps generated tests explainable. A draft is not promoted because CodeWard guessed well once; it is promoted because the repo has durable verification context.

## Adoption Guidance

Start with `manifest init`, but do not expect the first baseline to be perfect. Review the entries that affect your next PR:

- rename domains from file-oriented names to product terms
- mark accepted entries as `declared`
- raise confidence only when the team agrees
- add failure, edge, contract, and visual checks where they are truly required
- keep path patterns narrow enough that recommendations stay explainable
- review context-derived validation commands and safety rules before treating them as team policy
- prefer manifest anchors over inline code comments until symbol-level anchors are intentionally adopted

For private or complex products, the manifest is the place to encode what humans already know but do not want to repeat in every PR review.
