# CI/CD & Development Guide

This project contains both a Rust CLI and a VS Code extension. CI/CD is managed via GitHub Actions for both components. This guide explains how to build, test, release, and contribute to both parts of the project.

---

## Overview

- **Rust CLI**: Source in `src/`, tested and released via Cargo and GitHub Actions.
- **VS Code Extension**: Source in `vscode-extension/`, tested and released via npm and GitHub Actions.
- **Workflows**: All workflows are in `.github/workflows/`.

---

## Rust CLI

### Workflows

- **[rust.yml](.github/workflows/rust.yml)**: Lints, builds, and tests the Rust code on push/PR.
- **[release.yml](.github/workflows/release.yml)**: Builds binaries for all platforms and creates a GitHub Release when you push a tag like `vX.Y.Z`.

### Testing

- Run all tests:

  ```sh
  cargo test
  ```

- Run a specific test:

  ```sh
  cargo test <test_name>
  ```

### Release

- Update `Cargo.toml` with the new version.
- Update `CHANGELOG.md`.
- Tag and push:

  ```sh
  git tag vX.Y.Z
  git push origin vX.Y.Z
  ```

- The release workflow will build binaries and upload them to GitHub Releases.

---

## VS Code Extension

### Workflows

- **[vscode-extension.yml](.github/workflows/vscode-extension.yml)**: Lints, builds, tests, and packages the extension on push/PR.
- **[vscode-extension-publish.yml](.github/workflows/vscode-extension-publish.yml)**: On tag like `vscode-vX.Y.Z`, builds/tests/packages and uploads the `.vsix` to GitHub Releases. Manual publishing instructions included.
- **[vscode-extension-security.yml](.github/workflows/vscode-extension-security.yml)**: Runs `npm audit`, license checks, and auto-PRs for dependency updates.

### Testing

- Run all tests:

  ```sh
  cd vscode-extension
  npm install
  npm test
  ```

### Release

- Update `vscode-extension/package.json` with the new version.
- Update `vscode-extension/CHANGELOG.md`.
- Tag and push:

  ```sh
  git tag vscode-vX.Y.Z
  git push origin vscode-vX.Y.Z
  ```

- The publish workflow will build, test, and upload the `.vsix` to GitHub Releases.
- **Manual Marketplace Publishing:**
  - To publish to the VS Code Marketplace:

    ```sh
    cd vscode-extension
    npx vsce publish
    ```

  - Requires `VSCE_PAT` secret/token.

---

## Local Workflow Testing

- Use [act](https://github.com/nektos/act) to run workflows locally in Docker.
- Example (from project root):

  ```sh
  act push -W .github/workflows/vscode-extension.yml --container-architecture linux/amd64
  act push -W .github/workflows/rust.yml --container-architecture linux/amd64
  ```

- See `.actrc` for recommended settings (especially for Apple Silicon).

---

## Required Secrets

- **Rust CLI:**
  - `CRATES_IO_TOKEN` (for publishing to crates.io, if enabled)
- **VS Code Extension:**
  - `VSCE_PAT` (for publishing to VS Code Marketplace)
  - `GITHUB_TOKEN` (provided by GitHub Actions)

---

## File Structure

```
.github/
  workflows/           # All workflow YAML files
src/                   # Rust CLI source
vscode-extension/      # VS Code extension source, tests, and package.json
  CI-CD.md             # (This file, if you want to keep a copy here)
  README.md            # User-facing extension docs
  package.json         # Extension manifest
  ...
```

---

## Troubleshooting

- **Workflow fails on install:**
  - Make sure `package-lock.json` is in sync with `package.json` (run `npm install` after any dependency change).
- **Node version warnings:**
  - The publish workflow uses Node 20 for compatibility. The main CI workflow uses Node 18 (can be updated if needed).
- **Tests not found:**
  - Ensure test files are compiled to `out/*.test.js` in the extension.
- **Release not uploaded:**
  - Make sure you pushed a tag matching the required pattern (`vX.Y.Z` for Rust, `vscode-vX.Y.Z` for the extension).
- **Manual publishing fails:**
  - Ensure you have the correct tokens and are in the `vscode-extension` directory.

---

## More

- See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution guidelines.
- See [vscode-extension/README.md](vscode-extension/README.md) for extension usage.
- See [vscode-extension/CI-CD.md](vscode-extension/CI-CD.md) for legacy extension CI/CD details (if kept).
