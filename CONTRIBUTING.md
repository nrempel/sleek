# Contributing to Sleek

Thanks for wanting to contribute! Here's how to get started.

## Quick Setup

```bash
# Clone and build
git clone https://github.com/YOUR_USERNAME/sleek.git
cd sleek
cargo build

# Run tests
cargo test

# Make sure code is clean
cargo fmt && cargo clippy
```

**Requirements:** Rust 1.85+ (we use Edition 2024)

## Making Changes

1. **For bugs:** Write a failing test, then fix it
2. **For features:** Open an issue first to discuss
3. **For docs:** Just make it clearer

All new features need tests. Check out `tests/integration_tests.rs` for examples.

## Pull Requests

- Make sure tests pass (`cargo test`)
- Run `cargo fmt` and fix any `cargo clippy` warnings
- Write a clear description of what changed

## Project Structure

- `src/main.rs` - Main CLI code
- `tests/integration_tests.rs` - End-to-end tests
- Built on top of the [sqlformat](https://crates.io/crates/sqlformat) crate

## Questions?

Open an issue or check existing ones. We're friendly! 🙂
