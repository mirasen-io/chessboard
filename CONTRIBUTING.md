## Contributing

Thanks for your interest in contributing!

If you found a bug, want to improve something, explore an idea, or validate a platform feature, please open a Pull Request directly.

In the PR description:

- describe the problem
- describe the solution

Small and focused PRs are appreciated.

For non-trivial features, please discuss a short implementation plan before opening a PR.

Prefer the public API and extension system before changing core contracts. Core API, runtime, rendering, or architectural changes are welcome only when the extension path is insufficient and the change clearly improves long-term correctness, clarity, or maintainability.

Generic issue-claiming comments without project-specific context may be hidden or reported as spam.

Good first comments usually include at least one of:

- a concrete implementation question
- relevant files, APIs, or contracts you have looked at
- a short proposed plan
- a small clarification request about scope or expected behavior

Please do not add new dependencies, package scripts, GitHub Actions, release workflow changes, or broad architectural changes without prior discussion.

Good candidates for direct PRs include:

- focused fixes
- small feature ideas or experiments
- adapter/platform behavior validation and regression coverage

If you are not sure, opening an issue is still fine, but it is optional and mostly useful for larger discussions.

External contributions should target the `contribution` branch. Changes are promoted to `main` after the trusted validation flow passes.

Because promotions to `main` are typically squash-merged, the shared `contribution` branch may be reset to match `main` afterward. This is expected and only affects the shared staging branch, not your own branch or fork.

Thank you!
