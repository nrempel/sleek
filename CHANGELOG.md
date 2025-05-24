# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.4.0] - 2025-01-11

> **⚠️ MAJOR BREAKING RELEASE**  
> This is a significant breaking release with changes across the entire codebase. Users upgrading from v0.3.x should expect:
>
> - **Minimum Rust 1.85+ required** (due to Edition 2024 upgrade)
> - **CLI behavior changes** (boolean flags now require explicit values)
> - **Major dependency updates** with breaking changes (thiserror 2.x, sqlformat 0.3.x)
> - **Runtime behavior changes** (stdin processing, newline handling)
> - **Build system changes** (new clap syntax, modernized toolchain requirements)
>
> Please review the changes below carefully and test thoroughly before upgrading in production environments.

### Added

- Comprehensive integration test suite covering all CLI functionality (c006a77, 5a2941b, ff58275)
- Support for Rust Edition 2024 (1cb51a0)
- `rust-version` specification in Cargo.toml requiring Rust 1.85+ (1cb51a0)
- New `--trailing-newline` option to control whether files end with a newline (393a0dd, 2c3071d, ed3ad3a)

### Changed

- **BREAKING**: Updated to Rust Edition 2024, requires Rust 1.85+ (1cb51a0)
- **BREAKING**: Boolean CLI flags now require explicit values (e.g., `--uppercase=true` instead of `--uppercase`) (dc5293a)
- **BREAKING**: Updated major dependencies with breaking changes: thiserror 1.x → 2.0.12, sqlformat 0.2.x → 0.3.5, clap 4.4.x → 4.5.4
- **BREAKING**: Enhanced stdin processing behavior may affect existing scripts (ed3ad3a)
- Modernized CLI argument definitions to use new clap syntax (3209e1a)
- Refactored main.rs for better error handling and streamlined file processing (903269b)
- Simplified file I/O using `fs::read_to_string` and `fs::write` (b8629f1, 39f1053)
- Replaced `writeln!` with `push('\n')` for newline handling (685c0b7)

### Fixed

- Fixed typo in error enum: 'Patter' → 'Pattern' (49b9227)
- Handle uppercase false formatting (aa29cb8)

### Infrastructure

- Enhanced CI/CD configuration and security workflows
- Updated development tooling and VS Code settings

## [0.3.0] - Previous Release

### Added

- Initial stable release of sleek SQL formatter
- Basic SQL formatting capabilities
- Command-line interface with formatting options
- Support for stdin and file processing
- Check mode for validation

---

**Note**: Starting with v0.4.0, this project uses Rust Edition 2024 and requires Rust 1.85+.
