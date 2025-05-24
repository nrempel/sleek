# Sleek SQL Formatter

A VSCode extension that formats SQL files using the [Sleek CLI tool](https://github.com/nrempel/sleek).

## Features

- **Format SQL documents** with `Shift+Alt+F`
- **Format SQL selections**
- **Check formatting** status
- **Status bar indicator** showing format status
- **Configurable options** for indentation, casing, and spacing
- **Format on save/paste** (optional)
- **Automatic CLI download** - downloads Sleek CLI automatically if not found
- **Auto-update checking** - checks for Sleek CLI updates every 24 hours
- **Version management** - view current version and update notifications

## Requirements

The extension will automatically download the Sleek CLI tool when needed.

Alternatively, you can install it manually:

```bash
cargo install sleek
```

## Usage

1. Open a `.sql` file
2. Press `Shift+Alt+F` to format (extension will download Sleek CLI if needed)
3. Or use Command Palette → "Sleek: Format Document"

## Configuration

Available settings in VSCode preferences:

- `sleek.executable` - Path to sleek executable (default: "sleek")
- `sleek.indentSpaces` - Number of spaces for indentation (default: 4)
- `sleek.uppercase` - Convert keywords to UPPERCASE (default: true)
- `sleek.linesBetweenQueries` - Line breaks between queries (default: 2)
- `sleek.trailingNewline` - Add trailing newline (default: false)
- `sleek.formatOnSave` - Auto-format on save (default: false)
- `sleek.formatOnPaste` - Auto-format on paste (default: false)

## Commands

- `Sleek: Format Document` - Format entire SQL file
- `Sleek: Format Selection` - Format selected SQL text
- `Sleek: Check Formatting` - Check if SQL is properly formatted
- `Sleek: Download CLI` - Manually download/update Sleek CLI
- `Sleek: Check for Updates` - Check for available CLI updates
- `Sleek: Show Version Info` - Display current Sleek CLI version

## Example

**Before:**

```sql
select id, name from users where status = 'active'
```

**After:**

```sql
SELECT
    id,
    name
FROM
    users
WHERE
    STATUS = 'active'
```

## Development

```bash
npm install
npm run compile
npm test           # Run tests
npm run tdd        # Watch mode
```

## License

MIT
