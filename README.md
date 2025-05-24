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
sleek [FLAGS] [OPTIONS] <file_paths>...
```

### Arguments

- `<file_paths>...`: File path(s) to format, supports glob patterns. If no file
  paths are provided, reads from stdin.

### Flags

- `-c`, `--check`: Check if the code is already formatted. If not, it will exit
  with an error message.
- `-h`, `--help`: Prints help information.
- `-V`, `--version`: Prints version information.

### Options

- `-i`, `--indent_spaces <indent_spaces>`: Set the number of spaces to use for
  indentation (default: 4).
- `-U`, `--uppercase <uppercase>`: Change reserved keywords to ALL CAPS
  (default: true).
- `-l`, `--lines_between_queries <lines_between_queries>`: Set the number of
  line breaks after a query (default: 2).

## Examples

Format a query from stdin:

```bash
> echo "select * from users" | sleek --uppercase
SELECT
    *
FROM
    user
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
sleek --indent_spaces 2 --uppercase false "queries/*.sql"
```

To check if files are already formatted:

```bash
sleek --check "queries/*.sql"
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
