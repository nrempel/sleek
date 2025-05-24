use std::fmt::Write as FmtWrite;
use std::io::{Read, Write};
use std::process;
use std::{fs, io};

use clap::Parser;
use glob::glob;
use sqlformat::{FormatOptions, Indent, QueryParams, format};
use thiserror::Error;

fn main() {
    let options = Options::parse();
    let format_options = FormatOptions {
        indent: Indent::Spaces(options.indent_spaces),
        uppercase: Some(options.uppercase.unwrap_or(true)),
        lines_between_queries: options.lines_between_queries,
        ignore_case_convert: None,
    };

    let result = || -> Result<(), Error> {
        match options.file_paths.is_empty() {
            // If no file paths are provided, read from stdin
            true => {
                let mut input = String::new();
                io::stdin().read_to_string(&mut input)?;

                let formatted = format(&input, &QueryParams::default(), &format_options);
                if options.check {
                    if input != formatted {
                        return Err(Error::Check);
                    }
                    return Ok(());
                }

                io::stdout().write_all(formatted.as_bytes())?;
            }
            false => {
                for file_path in options.file_paths {
                    let entries = glob(&file_path)?;
                    for entry in entries {
                        let path = entry?;

                        let mut input = String::new();
                        fs::File::open(&path)?.read_to_string(&mut input)?;

                        let mut formatted =
                            format(&input, &QueryParams::default(), &format_options);

                        if options.trailing_newline && !formatted.ends_with('\n') {
                            writeln!(&mut formatted)?;
                        }

                        if options.check {
                            if input != formatted {
                                return Err(Error::Check);
                            }
                            return Ok(());
                        }

                        fs::File::create(&path)?.write_all(formatted.as_bytes())?;
                    }
                }
            }
        }
        Ok(())
    };

    process::exit(match result() {
        Ok(()) => 0,
        Err(e) => {
            eprintln!("{}", e);
            1
        }
    })
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
