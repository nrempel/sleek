# Sleek SQL Formatter for VSCode

A VSCode extension that integrates the [Sleek](https://github.com/nrempel/sleek) SQL formatter directly into your editor.

## Features

- **Format SQL documents** with customizable indentation and styling
- **Format selected SQL** code snippets
- **Format on save** (optional)
- **Format on paste** (optional)
- **Check formatting** to see if your SQL is already properly formatted
- **Status bar integration** showing formatting status
- **Keyboard shortcuts** for quick formatting
- **Configurable settings** matching Sleek CLI options

## Requirements

- **Sleek CLI tool** must be installed and available in your PATH
- Install Sleek via: `cargo install sleek`
- Or download from [GitHub Releases](https://github.com/nrempel/sleek/releases)

## Extension Settings

This extension contributes the following settings:

- `sleek.executable`: Path to the sleek executable (default: "sleek")
- `sleek.indentSpaces`: Number of spaces for indentation (default: 4)
- `sleek.uppercase`: Convert keywords to UPPERCASE (default: true)
- `sleek.linesBetweenQueries`: Line breaks after queries (default: 2)
- `sleek.trailingNewline`: Ensure files end with newline (default: false)
- `sleek.formatOnSave`: Auto-format on save (default: false)
- `sleek.formatOnPaste`: Auto-format on paste (default: false)

## Usage

### Commands

- **Sleek: Format Document** - Format the entire SQL document
- **Sleek: Format Selection** - Format only the selected SQL code
- **Sleek: Check Formatting** - Check if the SQL is properly formatted

### Keyboard Shortcuts

- `Shift+Alt+F` - Format Document (SQL files only)

### Context Menu

Right-click in a SQL file to access formatting commands.

### Status Bar

When editing SQL files, a status bar item shows:

- ✅ **Sleek** - SQL is properly formatted
- ⚠️ **Sleek** - SQL needs formatting
- ❌ **Sleek** - Formatting check failed

Click the status bar item to format the document.

## Example

**Before formatting:**

```sql
select id, name, email from users where id in (select user_id from orders where total > 100) and status = 'active'
```

**After formatting:**

```sql
SELECT
    id,
    name,
    email
FROM
    users
WHERE
    id IN (
        SELECT
            user_id
        FROM
            orders
        WHERE
            total > 100
    )
    AND STATUS = 'active'
```

## Installation

1. Install the Sleek CLI tool:

   ```bash
   cargo install sleek
   ```

2. Install this extension from the VSCode marketplace

3. Open a SQL file and start formatting!

## Configuration Example

Add to your `settings.json`:

```json
{
  "sleek.formatOnSave": true,
  "sleek.indentSpaces": 2,
  "sleek.uppercase": false,
  "sleek.linesBetweenQueries": 1
}
```

## Troubleshooting

**"Sleek executable not found"**

- Ensure Sleek is installed: `cargo install sleek`
- Verify it's in your PATH: `sleek --version`
- Or set the full path in settings: `"sleek.executable": "/path/to/sleek"`

**Formatting fails**

- Check that your SQL syntax is valid
- Verify Sleek works from command line
- Check the Output panel for error details

## Release Notes

### 0.1.0

- Initial release
- Document and selection formatting
- Format on save/paste options
- Status bar integration
- Configurable settings
- Context menu integration

## Contributing

Found a bug or have a feature request? Please report it on the [GitHub repository](https://github.com/nrempel/sleek).

## License

This extension is licensed under the MIT License.
