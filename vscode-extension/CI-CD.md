# VS Code Extension CI/CD Setup

This document describes the GitHub Actions workflows configured for the Sleek SQL Formatter VS Code extension.

## Workflows

### 1. VS Code Extension CI/CD (`vscode-extension.yml`)

This workflow runs on every push and pull request that affects the VS Code extension code.

**Triggers:**

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Changes to `vscode-extension/**` files

**Jobs:**

- **Test and Lint**: Runs linting, TypeScript compilation, and tests on Ubuntu
- **Build and Package**: Creates a `.vsix` package and uploads it as an artifact
- **Multi-platform Testing**: Tests the extension on Ubuntu, Windows, and macOS

### 2. Publish VS Code Extension (`vscode-extension-publish.yml`)

This workflow publishes the extension to both VS Code Marketplace and Open VSX Registry.

**Triggers:**

- Tags matching `vscode-v*` pattern (e.g., `vscode-v1.0.0`)
- Manual dispatch with publish option

**Features:**

- Publishes to VS Code Marketplace
- Publishes to Open VSX Registry (for VS Codium users)
- Creates GitHub releases with `.vsix` files
- Automatically extracts version from git tags

### 3. VS Code Extension Security (`vscode-extension-security.yml`)

This workflow handles security auditing and dependency management.

**Triggers:**

- Changes to `package*.json` files
- Weekly schedule (Sundays at 2 AM UTC)
- Manual dispatch

**Jobs:**

- **Security Audit**: Runs `npm audit` and license checks
- **Dependency Review**: Reviews new dependencies in pull requests
- **Update Dependencies**: Automatically updates dependencies and creates PRs

## Setup Instructions

### 1. Marketplace Publishing

To enable publishing to the VS Code Marketplace:

1. Create a Visual Studio Marketplace publisher account
2. Generate a Personal Access Token (PAT)
3. Add the PAT as a repository secret named `VSCE_PAT`

### 2. Open VSX Registry Publishing

To enable publishing to Open VSX Registry:

1. Create an account at <https://open-vsx.org>
2. Generate an access token
3. Add the token as a repository secret named `OVSX_PAT`

### 3. Repository Secrets

Add these secrets to your GitHub repository:

```
VSCE_PAT         # VS Code Marketplace Personal Access Token
OVSX_PAT         # Open VSX Registry Access Token
GITHUB_TOKEN     # Automatically provided by GitHub Actions
```

## Usage

### Running Tests

Tests run automatically on every push and PR. You can also run them locally:

```bash
cd vscode-extension
npm install
npm test
```

### Creating a Release

To publish a new version of the extension:

1. Update the version in `package.json`
2. Update `CHANGELOG.md` with release notes
3. Create and push a git tag:

```bash
git tag vscode-v1.0.0
git push origin vscode-v1.0.0
```

The publishing workflow will automatically:

- Build and test the extension
- Package it as a `.vsix` file
- Create a GitHub release

**Manual Publishing:**

To publish to the VS Code Marketplace:

```bash
npx vsce publish
```

To publish to Open VSX Registry:

```bash
npx ovsx publish
```

Ensure you have `VSCE_PAT` and `OVSX_PAT` set as environment variables or in your `.npmrc`/`.ovsxrc`.

### Manual Publishing

You can also trigger publishing manually from the GitHub Actions tab:

1. Go to Actions → "Publish VS Code Extension"
2. Click "Run workflow"
3. Select "true" for the publish option
4. Click "Run workflow"

### Security and Dependencies

The security workflow automatically:

- Audits dependencies for vulnerabilities
- Checks licenses for compliance
- Updates dependencies weekly
- Creates PRs for dependency updates

## File Structure

```
.github/
├── workflows/
│   ├── vscode-extension.yml          # Main CI/CD workflow
│   ├── vscode-extension-publish.yml  # Publishing workflow
│   └── vscode-extension-security.yml # Security and dependency management
└── dependency-review-config.yml      # Dependency review configuration

vscode-extension/
├── src/                              # TypeScript source code
├── out/                              # Compiled JavaScript (generated)
├── package.json                      # Extension manifest and dependencies
├── tsconfig.json                     # TypeScript configuration
└── *.vsix                           # Packaged extension files (generated)
```

## Best Practices

1. **Semantic Versioning**: Use semantic versioning for extension releases
2. **Changelog**: Keep `CHANGELOG.md` updated with each release
3. **Testing**: Ensure all tests pass before creating releases
4. **Security**: Review dependency updates and security alerts promptly
5. **Tagging**: Use consistent tag naming (`vscode-v1.0.0`) for releases

## Troubleshooting

### Publishing Fails

1. Check that `VSCE_PAT` and `OVSX_PAT` secrets are correctly set
2. Verify the PATs have not expired
3. Ensure the package.json version is valid

### Tests Fail

1. Check that all dependencies are installed
2. Verify TypeScript compilation is successful
3. Review test output for specific error messages

### Security Issues

1. Review npm audit results
2. Update vulnerable dependencies
3. Check license compatibility in dependency review
