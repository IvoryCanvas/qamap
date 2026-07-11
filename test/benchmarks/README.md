# Public benchmark fixtures

Each directory represents one reduced pull request:

- `base/` is committed on a temporary `main` branch.
- `head/` is copied over the baseline and committed on `benchmark/change`.
- `bench.config.json` declares the human expectation for the resulting QA draft.

Fixtures must stay small, synthetic, and safe to publish. The benchmark runner only reads the materialized repositories. It does not install dependencies, start services, run package scripts, or execute generated tests.

The committed matrix includes React/Next.js, Vue, SvelteKit, Expo/React Native, API, artifact, shared-component, configuration-only, and test-only changes. Framework fixtures protect observable behavior contracts rather than framework branding alone: route discovery, changed selectors, success signals, draft paths, and Behavior Graph evidence must agree.

Add a fixture when a real failure can be reduced to a reusable project shape. Prefer one clear regression per fixture over a large imitation of a production repository.
