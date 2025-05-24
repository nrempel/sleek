use std::io::{Read, Write};
use std::process;
use std::{fs, io};

use clap::Parser;
use glob::glob;
use sqlformat::{FormatOptions, Indent, QueryParams, format};
use thiserror::Error;

fn main() {
    let options = Options::parse();

    if let Err(e) = run(options) {
        eprintln!("{e}");
        process::exit(1);
    }
}

fn run(options: Options) -> Result<(), Error> {
    let format_options = FormatOptions {
        indent: Indent::Spaces(options.indent_spaces),
        uppercase: Some(options.uppercase.unwrap_or(true)),
        lines_between_queries: options.lines_between_queries,
        ignore_case_convert: None,
    };

    match options.file_paths.is_empty() {
        true => process_stdin(&format_options, options.check),
        false => process_files(&options.file_paths, &format_options, &options),
    }
}

fn process_stdin(format_options: &FormatOptions, check_only: bool) -> Result<(), Error> {
    let mut input = String::new();
    io::stdin().read_to_string(&mut input)?;

    let formatted = format(&input, &QueryParams::default(), format_options);
    if check_only {
        if input != formatted {
            return Err(Error::Check);
        }
        return Ok(());
    }

    io::stdout().write_all(formatted.as_bytes())?;
    Ok(())
}

fn process_files(
    file_paths: &[String],
    format_options: &FormatOptions,
    options: &Options,
) -> Result<(), Error> {
    for file_path in file_paths {
        let entries = glob(file_path)?;
        for entry in entries {
            let path = entry?;
            let input = fs::read_to_string(&path)?;

            let mut formatted = format(&input, &QueryParams::default(), format_options);

            if options.trailing_newline && !formatted.ends_with('\n') {
                formatted.push('\n');
            }

            if options.check {
                if input != formatted {
                    return Err(Error::Check);
                }
                return Ok(());
            }

            fs::write(&path, formatted)?;
        }
    }
    Ok(())
}

#[derive(Error, Debug)]
enum Error {
    #[error("Failed to read from stdin: {0}")]
    Io(#[from] io::Error),
    #[error("Failed to read glob pattern: {0}")]
    Glob(#[from] glob::GlobError),
    #[error("Failed to read glob pattern: {0}")]
    Pattern(#[from] glob::PatternError),
    #[error("Input is not formatted correctly. Run without --check to format the input.")]
    Check,
    #[error("Failed to append a trailing newline to the formatted SQL.")]
    Format(#[from] std::fmt::Error),
}

#[derive(Parser)]
#[command(author, version, about, long_about = None)]
struct Options {
    /// File path(s) to format, supports glob patterns.
    /// If no file paths are provided, reads from stdin.
    #[arg(value_name = "FILE")]
    file_paths: Vec<String>,

    /// Check if the code is already formatted without modifying files
    #[arg(short, long)]
    check: bool,

    /// Number of spaces to use for indentation
    #[arg(short, long, value_name = "NUM", default_value = "4")]
    indent_spaces: u8,

    /// Convert reserved keywords to UPPERCASE
    #[arg(short = 'U', long, value_name = "BOOL")]
    uppercase: Option<bool>,

    /// Number of line breaks to insert after each query
    #[arg(short, long, value_name = "NUM", default_value = "2")]
    lines_between_queries: u8,

    /// Ensure files end with a trailing newline
    #[arg(short = 'n', long)]
    trailing_newline: bool,
}
