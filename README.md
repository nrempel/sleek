# Sleek ✨

[![Crates.io](https://img.shields.io/crates/v/sleek.svg)](https://crates.io/crates/sleek)
[![GitHub Actions](https://github.com/nrempel/sleek/actions/workflows/rust.yml/badge.svg)](https://github.com/nrempel/sleek/actions)
[![GitHub Releases](https://img.shields.io/github/release/nrempel/sleek.svg)](https://github.com/nrempel/sleek/releases)

Sleek is a CLI tool for formatting SQL. It helps you maintain a consistent style
across your SQL code, enhancing readability and productivity.

The heavy lifting is done by the
[sqlformat](https://github.com/shssoichiro/sqlformat-rs) crate.

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
- Automatically adds trailing newlines to formatted output (can be disabled with `--trailing-newline=false`)

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
- `-U`, `--uppercase <BOOL>`: Convert reserved keywords to UPPERCASE [possible values: true, false]
- `-l`, `--lines-between-queries <NUM>`: Number of line breaks to insert after each query (default: 2)
- `-n`, `--trailing-newline`: Ensure files end with a trailing newline (default: true)
- `-h`, `--help`: Print help
- `-V`, `--version`: Print version

## Examples

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
sleek --trailing-newline=false "queries/*.sql"
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
