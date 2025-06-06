# Sleek ✨

[![CLI Release](https://img.shields.io/github/v/release/nrempel/sleek?filter=v*&logo=rust&logoColor=white&label=CLI)](https://github.com/nrempel/sleek/releases)
[![VS Code Release](https://img.shields.io/github/v/release/nrempel/sleek?filter=vscode-v*&logo=visualstudiocode&logoColor=white&label=VS%20Code)](https://github.com/nrempel/sleek/releases)
[![Crates.io](https://img.shields.io/crates/v/sleek?logo=rust&logoColor=white)](https://crates.io/crates/sleek)
[![CLI CI](https://img.shields.io/github/actions/workflow/status/nrempel/sleek/cli-ci.yml?logo=rust&logoColor=white&label=CLI%20CI)](https://github.com/nrempel/sleek/actions)
[![Extension CI](https://img.shields.io/github/actions/workflow/status/nrempel/sleek/extension-ci.yml?logo=visualstudiocode&logoColor=white&label=Extension%20CI)](https://github.com/nrempel/sleek/actions)
[![Downloads](https://img.shields.io/crates/d/sleek?logo=rust&logoColor=white)](https://crates.io/crates/sleek)
[![License](https://img.shields.io/crates/l/sleek?color=blue)](https://github.com/nrempel/sleek/blob/main/LICENSE)

> **✨ Looking for a VS Code extension?**
> Sleek is also available as a [VS Code extension](https://marketplace.visualstudio.com/items?itemName=lucent.sleek-sql) for SQL formatting! 🚀

<p align="center">
  <img src="./sleek.png" alt="Sleek Logo" width="200" />
</p>

Sleek is a CLI tool for formatting SQL. It helps you maintain a consistent style
across your SQL code, enhancing readability and productivity.

The heavy lifting is done by the
[sqlformat](https://github.com/shssoichiro/sqlformat-rs) crate.

## VS Code Extension

- **[Install from VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=lucent.sleek-sql)**
- See its [README](./vscode-extension/README.md) for usage and features.
- See [releases documentation](./RELEASES.md) for build, test, and release automation details.

## Before and After

Here's an example of a SQL query before and after being formatted by Sleek:

### Before

```sql
select id, name, email from users where id in (select user_id from orders where total > 100) and status = 'active'
```

### After

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

## Features

- Format SQL files using customizable indentation and character case options
- Supports glob patterns, allowing you to format multiple files and patterns
- Check whether your SQL files are already formatted without altering them with
  the `--check` flag
- Uppercase keywords by default (disable with `--uppercase false`)
- Automatically adds trailing newlines to formatted output (disable with `--trailing-newline false`)

## Installation

### Download Compiled Binaries

You can download the compiled binaries for Sleek from the
[GitHub Releases](https://github.com/nrempel/sleek/releases) page. Choose the
binary that corresponds to your operating system and architecture, and place it
in a directory included in your system's `PATH` environment variable.

### Install with Cargo

To install Sleek using Cargo, you'll need to have
[Rust](https://www.rust-lang.org/tools/install) installed on your system. Once
Rust is installed, you can install Sleek with Cargo:

```bash
cargo install sleek
```

## Usage

```bash
sleek [OPTIONS] [FILE]...
```

### Arguments

- `[FILE]...`: File path(s) to format, supports glob patterns. If no file paths are provided, reads from stdin.

### Options

- `-c`, `--check`: Check if the code is already formatted without modifying files
- `-i`, `--indent-spaces <NUM>`: Number of spaces to use for indentation (default: 4)
- `-U`, `--uppercase <BOOL>`: Convert reserved keywords to UPPERCASE (default: true) [possible values: true, false]
- `-l`, `--lines-between-queries <NUM>`: Number of line breaks to insert after each query (default: 2)
- `-n`, `--trailing-newline <BOOL>`: Ensure files end with a trailing newline (default: true) [possible values: true, false]
- `-h`, `--help`: Print help
- `-V`, `--version`: Print version

## Examples

**Note**: Boolean flags require explicit values. Both formats work:

- Space format: `--uppercase true` (matches help output)
- Equals format: `--uppercase=true` (also supported)

Format a query from stdin:

```bash
> echo "select * from users" | sleek --uppercase true
SELECT
    *
FROM
    users
```

To check if a query is formatted correctly from stdin:

```bash
> echo "select * from users" | sleek --check
Input is not formatted correctly. Run without --check to format the input.
```

To format a single file with the default options:

```bash
sleek my_query.sql
```

To format multiple files using a glob pattern:

```bash
sleek "queries/*.sql"
```

To format files with custom options:

```bash
sleek --indent-spaces 2 --uppercase false "queries/*.sql"
```

To check if files are already formatted:

```bash
sleek --check "queries/*.sql"
```

To format files without trailing newlines:

```bash
sleek --trailing-newline false "queries/*.sql"
```

## Testing

Sleek includes comprehensive integration tests that verify the CLI functionality works correctly.

### Running Tests

To run all tests:

```bash
cargo test
```

To run only integration tests:

```bash
cargo test --test integration_tests
```

All tests use temporary files and the actual compiled binary to ensure real-world behavior is tested.

## License

This project is available under the MIT License.
