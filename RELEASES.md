# Releases & CI/CD Guide

This project contains both a Rust CLI and a VS Code extension. Release automation is managed via GitHub Actions for both components. This guide explains how to build, test, and release both parts of the project.

---

## Overview

- **Rust CLI**: Source in `src/`, tested and released via Cargo and GitHub Actions.
- **VS Code Extension**: Source in `vscode-extension/`, tested and released via npm and GitHub Actions.
- **Workflows**: All workflows are in `.github/workflows/`.

---

## Rust CLI

### Workflows

- **[rust.yml](.github/workflows/rust.yml)**: Lints, builds, tests, and runs security audits on the Rust code on push/PR.
- **[release.yml](.github/workflows/release.yml)**: Builds binaries for all platforms and creates a GitHub Release when you push a tag like `vX.Y.Z` (excludes `vscode-v*` tags).

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

- **[vscode-extension-publish.yml](.github/workflows/vscode-extension-publish.yml)**: Consolidated CI/CD workflow that:
  - Lints, builds, and tests the extension on push/PR
  - Runs cross-platform tests on PRs
  - Packages the extension and uploads `.vsix` to GitHub Releases on `vscode-vX.Y.Z` tags
  - Includes manual publishing instructions for both VS Code Marketplace and Open VSX Registry

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

  - To publish to Open VSX Registry:

    ```sh
    cd vscode-extension
    npx ovsx publish
    ```

  - Requires `VSCE_PAT` and `OVSX_PAT` secrets/tokens respectively.

---

## Local Workflow Testing

- Use [act](https://github.com/nektos/act) to run workflows locally in Docker.
- Example (from project root):

  ```sh
  act push -W .github/workflows/vscode-extension-publish.yml --container-architecture linux/amd64
  act push -W .github/workflows/rust.yml --container-architecture linux/amd64
  ```

- See `.actrc` for recommended settings (especially for Apple Silicon).

---

## Required Secrets

- **Rust CLI:**
  - `CRATES_IO_TOKEN` (for publishing to crates.io, if enabled)
- **VS Code Extension:**
  - `VSCE_PAT` (for publishing to VS Code Marketplace)
  - `OVSX_PAT` (for publishing to Open VSX Registry)
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
- **Node version consistency:**
  - All workflows now use Node 20 for consistency and latest features.
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
