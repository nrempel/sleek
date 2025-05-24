# VSCode Extension Development Guide

## Setup

1. **Install dependencies:**

   ```bash
   npm install
   ```

2. **Ensure Sleek is installed:**

   ```bash
   cargo install sleek
   # or download from https://github.com/nrempel/sleek/releases
   ```

## Development

### Building

```bash
npm run compile          # Compile TypeScript
npm run watch           # Watch for changes and auto-compile
```

### Testing

```bash
npm run lint            # Run ESLint
npm run test            # Run tests (when implemented)
```

### Debugging

1. Open this folder in VSCode
2. Press `F5` to launch a new Extension Development Host window
3. Open a `.sql` file in the new window
4. Test the extension commands:
   - `Cmd/Ctrl + Shift + P` → "Sleek: Format Document"
   - `Shift + Alt + F` to format document
   - Right-click for context menu options

### Packaging

```bash
npm run package         # Creates sleek-sql-formatter-X.X.X.vsix
```

### Installation for Testing

```bash
code --install-extension sleek-sql-formatter-0.1.0.vsix
```

## File Structure

```
vscode-extension/
├── src/
│   └── extension.ts        # Main extension code
├── out/                    # Compiled JavaScript (git ignored)
├── package.json           # Extension manifest
├── tsconfig.json          # TypeScript config
├── .eslintrc.json         # ESLint config
├── README.md              # Extension documentation
├── CHANGELOG.md           # Version history
├── LICENSE                # MIT license
├── test.sql               # Sample SQL file for testing
└── .gitignore             # Git ignore rules
```

## Key Features Implemented

- ✅ Document formatting
- ✅ Selection formatting
- ✅ Format on save (optional)
- ✅ Format on paste (optional)
- ✅ Check formatting command
- ✅ Status bar integration
- ✅ Configurable settings
- ✅ Context menu integration
- ✅ Keyboard shortcuts
- ✅ Error handling

## Configuration

Add to your VSCode `settings.json`:

```json
{
  "sleek.formatOnSave": true,
  "sleek.indentSpaces": 2,
  "sleek.uppercase": false,
  "sleek.linesBetweenQueries": 1,
  "sleek.executable": "/custom/path/to/sleek"
}
```

## Publishing

1. Install vsce: `npm install -g @vscode/vsce`
2. Login: `vsce login <publisher>`
3. Publish: `vsce publish`

Or upload the `.vsix` file manually to the marketplace.
