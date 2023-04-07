use std::error::Error;
use std::fs;
use std::io::{Read, Write};
use std::path::PathBuf;
use std::process;

use clap::Parser;
use glob::glob;
use sqlformat::{format, FormatOptions, Indent, QueryParams};

fn main() {
    let options = Options::parse();
    let format_options = FormatOptions {
        indent: Indent::Spaces(options.indent_spaces),
        uppercase: options.uppercase,
        lines_between_queries: options.lines_between_queries,
    };

    let result = || -> Result<(), String> {
        for file_path in options.file_paths {
            let entries =
                glob(&file_path).map_err(|e| format!("Failed to read glob pattern: {}", e))?;

            for entry in entries {
                let path = entry.map_err(|e| format!("Error processing file path: {}", e))?;
                process_file(&path, options.check, format_options)
                    .map_err(|e| format!("Error processing {}: {}", path.display(), e))?;
            }
        }
        Ok(())
    };

    process::exit(match result() {
        Ok(()) => 0,
        Err(e) => {
            eprintln!("{e}");
            1
        }
    })
}

fn process_file(
    path: &PathBuf,
    check: bool,
    format_options: FormatOptions,
) -> Result<(), Box<dyn Error>> {
    let mut input = String::new();
    fs::File::open(path)?.read_to_string(&mut input)?;

    let formatted = format(&input, &QueryParams::default(), format_options);

    if check {
        if input != formatted {
            return Err("Run without --check to format the file.".into());
        }
        return Ok(());
    }

    fs::File::create(path)?.write_all(formatted.as_bytes())?;

    Ok(())
}

#[derive(Parser)]
struct Options {
    /// File path(s) to format, supports glob patterns
    #[clap(required(true))]
    file_paths: Vec<String>,
    /// Check if the code is already formatted
    #[clap(short, long)]
    check: bool,
    /// Set the number of spaces to use for indentation
    #[clap(short, long, default_value = "4")]
    indent_spaces: u8,
    /// Change reserved keywords to ALL CAPS
    #[clap(short = 'U', long, default_value = "true")]
    uppercase: bool,
    /// Set the number of line breaks after a query
    #[clap(short, long, default_value = "2")]
    lines_between_queries: u8,
}

#[cfg(test)]
mod tests {
    use std::path::Path;

    use super::*;

    #[test]
    fn test_process_file() -> Result<(), Box<dyn Error>> {
        let test_input = "SELECT * from users;";
        let test_output = "SELECT\n    *\nFROM\n    users;";
        let test_path = "test_input.sql";

        // Create the test input file
        fs::write(test_path, test_input)?;

        let format_options = FormatOptions {
            indent: Indent::Spaces(4),
            uppercase: true,
            lines_between_queries: 2,
        };

        // Run the process_file function on the test input file
        process_file(&Path::new(test_path).to_path_buf(), false, format_options)?;

        // Read the contents of the formatted file
        let formatted_contents = fs::read_to_string(test_path)?;

        // Clean up the test file
        fs::remove_file(test_path)?;

        // Assert that the contents match the expected output
        assert_eq!(formatted_contents, test_output);

        Ok(())
    }
}
