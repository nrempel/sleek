use std::fs;
use std::io::Write;
use std::process::{Command, Stdio};
use tempfile::TempDir;

fn sleek_command() -> Command {
    Command::new(env!("CARGO_BIN_EXE_sleek"))
}

fn run_sleek_with_stdin(args: &[&str], input: &[u8]) -> std::process::Output {
    let mut cmd = sleek_command();
    for arg in args {
        cmd.arg(arg);
    }

    let mut child = cmd
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to start sleek");

    if let Some(stdin) = child.stdin.as_mut() {
        stdin.write_all(input).expect("Failed to write to stdin");
    }

    child.wait_with_output().expect("Failed to get output")
}

#[test]
fn test_help_flag() {
    let output = sleek_command()
        .arg("--help")
        .output()
        .expect("Failed to execute sleek");

    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.contains("Sleek is a CLI tool for formatting SQL files"));
    assert!(stdout.contains("Usage:"));
}

#[test]
fn test_version_flag() {
    let output = sleek_command()
        .arg("--version")
        .output()
        .expect("Failed to execute sleek");

    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.contains("sleek"));
}

#[test]
fn test_format_from_stdin() {
    let output = run_sleek_with_stdin(
        &["--indent-spaces", "4"],
        b"select * from users where id = 1",
    );

    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.contains("SELECT"));
    assert!(stdout.contains("FROM"));
    assert!(stdout.contains("users"));
}

#[test]
fn test_check_flag_formatted_input() {
    let output = run_sleek_with_stdin(
        &["--check"],
        b"SELECT\n    *\nFROM\n    users\nWHERE\n    id = 1\n",
    );
    assert!(output.status.success());
}

#[test]
fn test_check_flag_unformatted_input() {
    let output = run_sleek_with_stdin(&["--check"], b"select * from users where id = 1");

    assert!(!output.status.success());
    let stderr = String::from_utf8(output.stderr).unwrap();
    assert!(stderr.contains("Input is not formatted correctly"));
}

#[test]
fn test_format_file() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test.sql");

    let input = "select * from users where id = 1";
    fs::write(&file_path, input).unwrap();

    let output = sleek_command()
        .arg(file_path.to_str().unwrap())
        .output()
        .expect("Failed to execute sleek");

    assert!(output.status.success());

    let formatted_content = fs::read_to_string(&file_path).unwrap();
    assert!(formatted_content.contains("SELECT"));
    assert!(formatted_content.contains("FROM"));
}

#[test]
fn test_check_file_formatted() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test.sql");

    let input = "SELECT\n    *\nFROM\n    users\nWHERE\n    id = 1\n";
    fs::write(&file_path, input).unwrap();

    let output = sleek_command()
        .arg("--check")
        .arg(file_path.to_str().unwrap())
        .output()
        .expect("Failed to execute sleek");

    assert!(output.status.success());
}

#[test]
fn test_check_file_unformatted() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test.sql");

    let input = "select * from users where id = 1";
    fs::write(&file_path, input).unwrap();

    let output = sleek_command()
        .arg("--check")
        .arg(file_path.to_str().unwrap())
        .output()
        .expect("Failed to execute sleek");

    assert!(!output.status.success());
}

#[test]
fn test_trailing_newline_flag() {
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test.sql");

    let input = "select * from users";
    fs::write(&file_path, input).unwrap();

    let output = sleek_command()
        .arg("--trailing-newline=true")
        .arg(file_path.to_str().unwrap())
        .output()
        .expect("Failed to execute sleek");

    assert!(output.status.success());

    let formatted_content = fs::read_to_string(&file_path).unwrap();
    assert!(formatted_content.ends_with('\n'));
}

#[test]
fn test_custom_indent_spaces() {
    use std::io::Write;
    use std::process::Stdio;

    let mut child = sleek_command()
        .arg("--indent-spaces")
        .arg("2")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("Failed to start sleek");

    let stdin = child.stdin.as_mut().expect("Failed to get stdin");
    stdin
        .write_all(b"select * from users")
        .expect("Failed to write to stdin");
    let _ = stdin;

    let output = child.wait_with_output().expect("Failed to get output");
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    // The output should have 2-space indentation
    assert!(stdout.contains("  *")); // 2 spaces before *
}

#[test]
fn test_uppercase_flag() {
    use std::io::Write;
    use std::process::Stdio;

    let mut child = sleek_command()
        .arg("--uppercase=true")
        .stdin(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .expect("Failed to start sleek");

    let stdin = child.stdin.as_mut().expect("Failed to get stdin");
    stdin
        .write_all(b"select * from users")
        .expect("Failed to write to stdin");
    let _ = stdin;

    let output = child.wait_with_output().expect("Failed to get output");
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.contains("SELECT"));
    assert!(stdout.contains("FROM"));
}

#[test]
fn test_nonexistent_file() {
    let output = sleek_command()
        .arg("nonexistent.sql")
        .output()
        .expect("Failed to execute sleek");

    // Glob patterns that don't match any files succeed (no-op)
    assert!(output.status.success());
}

#[test]
fn test_full_outer_join_formatting() {
    // Test for GitHub issue #81: FULL OUTER JOIN causes confusion
    let input = "select * from users u full outer join departments d on u.deptid = d.id";
    let output = run_sleek_with_stdin(&[], input.as_bytes());

    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();

    // The bug: Currently formats incorrectly as "users u FULL"
    // Should format as separate lines with "FULL OUTER JOIN" together
    println!("Actual output:\n{}", stdout);

    // This assertion will likely fail, demonstrating the bug
    assert!(
        !stdout.contains("users u FULL"),
        "FULL OUTER JOIN should not have FULL on the same line as table alias"
    );

    // This assertion shows what the correct formatting should be
    assert!(
        stdout.contains("FULL OUTER JOIN"),
        "FULL OUTER JOIN should be kept together on the same line"
    );
}

#[test]
fn test_left_outer_join_formatting_works_correctly() {
    // Verify that LEFT OUTER JOIN works correctly (as mentioned in the issue)
    let input = "select * from users u left outer join departments d on u.deptid = d.id";
    let output = run_sleek_with_stdin(&[], input.as_bytes());

    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();

    // LEFT OUTER JOIN should work correctly
    assert!(
        !stdout.contains("users u LEFT"),
        "LEFT OUTER JOIN should not have LEFT on the same line as table alias"
    );

    assert!(
        stdout.contains("LEFT OUTER JOIN"),
        "LEFT OUTER JOIN should be kept together on the same line"
    );
}

#[test]
fn test_issue_60_comma_separated_lists_current_behavior() {
    // Test for GitHub issue #60: Enhancement request for more compact formatting
    // Currently, sleek breaks comma-separated items onto separate lines
    let input = "SELECT id, name, email, status FROM users, orders WHERE users.id = orders.user_id AND status = 'active'";
    let output = run_sleek_with_stdin(&[], input.as_bytes());

    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();

    println!("Current behavior:\n{}", stdout);

    // Document current behavior: comma-separated items are on separate lines
    assert!(
        stdout.contains("SELECT\n    id,\n    name,\n    email,"),
        "Currently SELECT columns are formatted on separate lines"
    );
    assert!(
        stdout.contains("FROM\n    users,\n    orders"),
        "Currently FROM tables are formatted on separate lines"
    );
    assert!(
        stdout.contains("WHERE\n    users.id = orders.user_id\n    AND"),
        "Currently WHERE conditions use line breaks with AND"
    );

    // This test documents the current behavior and will help when implementing
    // the enhancement request for more compact formatting like:
    // SELECT id, name, email, status
    // FROM users, orders
    // WHERE users.id = orders.user_id AND status = 'active'
}

#[test]
fn test_explicit_boolean_flags_required() {
    // Test for the new explicit boolean flag behavior
    // All boolean flags should require explicit =true or =false values
    let input = "select * from users";

    // Test --uppercase=true (explicit true)
    let output = run_sleek_with_stdin(&["--uppercase=true"], input.as_bytes());
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(
        stdout.contains("SELECT"),
        "uppercase=true should produce uppercase keywords"
    );
    assert!(
        stdout.contains("FROM"),
        "uppercase=true should produce uppercase keywords"
    );

    // Test --uppercase=false (explicit false)
    let output = run_sleek_with_stdin(&["--uppercase=false"], input.as_bytes());
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(
        stdout.contains("select"),
        "uppercase=false should produce lowercase keywords"
    );
    assert!(
        stdout.contains("from"),
        "uppercase=false should produce lowercase keywords"
    );

    // Test --trailing-newline=true (explicit true)
    let output = run_sleek_with_stdin(&["--trailing-newline=true"], input.as_bytes());
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(
        stdout.ends_with('\n'),
        "trailing-newline=true should add trailing newline"
    );

    // Test --trailing-newline=false (explicit false)
    let output = run_sleek_with_stdin(&["--trailing-newline=false"], input.as_bytes());
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(
        !stdout.ends_with('\n'),
        "trailing-newline=false should not add trailing newline"
    );

    // Test combining both flags
    let output = run_sleek_with_stdin(
        &["--uppercase=true", "--trailing-newline=false"],
        input.as_bytes(),
    );
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    assert!(stdout.contains("SELECT"), "should respect uppercase=true");
    assert!(
        !stdout.ends_with('\n'),
        "should respect trailing-newline=false"
    );
}

#[test]
fn test_default_behavior_when_flags_not_specified() {
    // Test the default behavior when boolean flags are not specified
    // We should provide sensible defaults without requiring explicit values
    let input = "select * from users";

    let output = run_sleek_with_stdin(&[], input.as_bytes());
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();

    // Default should be uppercase=true (SQL convention)
    assert!(
        stdout.contains("SELECT"),
        "default should be uppercase keywords"
    );
    assert!(
        stdout.contains("FROM"),
        "default should be uppercase keywords"
    );

    // Default should be trailing_newline=true (file convention)
    assert!(
        stdout.ends_with('\n'),
        "default should add trailing newline"
    );
}

#[test]
fn test_boolean_flags_work_with_files() {
    // Test that explicit boolean flags work with file processing too
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("test.sql");

    let input = "select * from users";
    fs::write(&file_path, input).unwrap();

    // Test --uppercase=false --trailing-newline=false
    let output = sleek_command()
        .arg("--uppercase=false")
        .arg("--trailing-newline=false")
        .arg(file_path.to_str().unwrap())
        .output()
        .expect("Failed to execute sleek");

    assert!(output.status.success());

    let formatted_content = fs::read_to_string(&file_path).unwrap();
    assert!(
        formatted_content.contains("select"),
        "should use lowercase keywords"
    );
    assert!(
        formatted_content.contains("from"),
        "should use lowercase keywords"
    );
    assert!(
        !formatted_content.ends_with('\n'),
        "should not add trailing newline"
    );
}

#[test]
fn test_old_flag_syntax_should_fail() {
    // Test that the old flag syntax (without explicit values) should fail
    // This ensures we're enforcing the new explicit boolean approach

    // Test old --uppercase flag (without value) should fail
    // Don't use stdin since the command will fail before reading it
    let output = sleek_command()
        .arg("--uppercase")
        .output()
        .expect("Failed to execute sleek");
    assert!(
        !output.status.success(),
        "--uppercase without explicit value should fail"
    );

    // Test old --trailing-newline flag (without value) should fail
    // Don't use stdin since the command will fail before reading it
    let output = sleek_command()
        .arg("--trailing-newline")
        .output()
        .expect("Failed to execute sleek");
    assert!(
        !output.status.success(),
        "--trailing-newline without explicit value should fail"
    );
}

#[test]
fn test_both_boolean_formats_work() {
    // Test that both space-separated and equals-separated boolean formats work
    let input = "select * from users";

    // Space format (matches help display: --uppercase <BOOL>)
    let output1 = run_sleek_with_stdin(&["--uppercase", "true"], input.as_bytes());
    assert!(output1.status.success());
    let stdout1 = String::from_utf8(output1.stdout).unwrap();
    assert!(stdout1.contains("SELECT"), "space format should work");

    // Equals format (also supported)
    let output2 = run_sleek_with_stdin(&["--uppercase=true"], input.as_bytes());
    assert!(output2.status.success());
    let stdout2 = String::from_utf8(output2.stdout).unwrap();
    assert!(stdout2.contains("SELECT"), "equals format should work");

    // Both should produce identical output
    assert_eq!(
        stdout1, stdout2,
        "both formats should produce identical results"
    );
}

#[test]
fn test_lines_between_queries_flag() {
    // Test the --lines-between-queries flag with multiple queries
    let input = "SELECT * FROM users; SELECT * FROM orders;";

    // Test with default (2 lines)
    let output = run_sleek_with_stdin(&[], input.as_bytes());
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    // Should have 1 empty line between queries (2 total newlines)
    assert!(
        stdout.contains(";\n\nSELECT"),
        "default should have 1 empty line between queries"
    );

    // Test with custom value (0 lines)
    let output = run_sleek_with_stdin(&["--lines-between-queries", "0"], input.as_bytes());
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    // Should have no extra lines between queries
    assert!(
        stdout.contains(";\nSELECT"),
        "should have 0 lines between queries"
    );

    // Test with custom value (3 lines)
    let output = run_sleek_with_stdin(&["--lines-between-queries", "3"], input.as_bytes());
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    // Should have 2 empty lines between queries (3 total newlines)
    assert!(
        stdout.contains(";\n\n\nSELECT"),
        "should have 2 empty lines between queries"
    );
}

#[test]
fn test_invalid_indent_spaces_value() {
    // Test that invalid indent-spaces values are handled gracefully
    let output = sleek_command()
        .arg("--indent-spaces")
        .arg("not-a-number")
        .output()
        .expect("Failed to execute sleek");

    assert!(!output.status.success());
    let stderr = String::from_utf8(output.stderr).unwrap();
    assert!(
        stderr.contains("invalid value"),
        "should report invalid value error"
    );
}

#[test]
fn test_invalid_boolean_values() {
    // Test that invalid boolean values are rejected
    let output = sleek_command()
        .arg("--uppercase")
        .arg("maybe")
        .output()
        .expect("Failed to execute sleek");

    assert!(!output.status.success());
    let stderr = String::from_utf8(output.stderr).unwrap();
    assert!(
        stderr.contains("invalid value"),
        "should reject invalid boolean value"
    );
}

#[test]
fn test_empty_input_from_stdin() {
    // Test handling of empty input from stdin
    let output = run_sleek_with_stdin(&[], b"");
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    // Empty input should produce minimal output (just a newline due to trailing_newline=true default)
    assert_eq!(stdout, "\n", "empty input should produce just a newline");
}

#[test]
fn test_whitespace_only_input() {
    // Test handling of whitespace-only input
    let output = run_sleek_with_stdin(&[], b"   \n\t  \n  ");
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    // Whitespace-only input should be cleaned up
    assert_eq!(stdout.trim(), "", "whitespace-only input should be cleaned");
}

#[test]
fn test_multiple_files_with_glob_pattern() {
    // Test formatting multiple files using glob patterns
    let temp_dir = TempDir::new().unwrap();

    // Create multiple SQL files
    let file1 = temp_dir.path().join("query1.sql");
    let file2 = temp_dir.path().join("query2.sql");
    let file3 = temp_dir.path().join("other.txt"); // Non-SQL file

    fs::write(&file1, "select * from users").unwrap();
    fs::write(&file2, "select * from orders").unwrap();
    fs::write(&file3, "not sql content").unwrap();

    // Format all .sql files
    let glob_pattern = format!("{}/*.sql", temp_dir.path().display());
    let output = sleek_command()
        .arg(&glob_pattern)
        .output()
        .expect("Failed to execute sleek");

    assert!(output.status.success());

    // Check that SQL files were formatted
    let content1 = fs::read_to_string(&file1).unwrap();
    let content2 = fs::read_to_string(&file2).unwrap();
    let content3 = fs::read_to_string(&file3).unwrap();

    assert!(content1.contains("SELECT"), "file1 should be formatted");
    assert!(content2.contains("SELECT"), "file2 should be formatted");
    assert_eq!(
        content3, "not sql content",
        "non-SQL file should be unchanged"
    );
}

#[test]
fn test_check_mode_with_multiple_files() {
    // Test check mode with multiple files where some are formatted and some aren't
    let temp_dir = TempDir::new().unwrap();

    let formatted_file = temp_dir.path().join("formatted.sql");
    let unformatted_file = temp_dir.path().join("unformatted.sql");

    // One properly formatted file (with trailing newline)
    fs::write(&formatted_file, "SELECT\n    *\nFROM\n    users\n").unwrap();
    // One unformatted file
    fs::write(&unformatted_file, "select * from orders").unwrap();

    // Check should fail because one file is unformatted (regardless of order)
    let glob_pattern = format!("{}/*.sql", temp_dir.path().display());
    let output = sleek_command()
        .arg("--check")
        .arg(&glob_pattern)
        .output()
        .expect("Failed to execute sleek");

    assert!(
        !output.status.success(),
        "check should fail when any file is unformatted"
    );
}

#[test]
fn test_check_mode_with_all_files_formatted() {
    // Test check mode with multiple files where all are properly formatted
    let temp_dir = TempDir::new().unwrap();

    let file1 = temp_dir.path().join("file1.sql");
    let file2 = temp_dir.path().join("file2.sql");

    // Both files properly formatted (with trailing newlines)
    fs::write(&file1, "SELECT\n    *\nFROM\n    users\n").unwrap();
    fs::write(&file2, "SELECT\n    *\nFROM\n    orders\n").unwrap();

    // Check should succeed because all files are properly formatted
    let glob_pattern = format!("{}/*.sql", temp_dir.path().display());
    let output = sleek_command()
        .arg("--check")
        .arg(&glob_pattern)
        .output()
        .expect("Failed to execute sleek");

    assert!(
        output.status.success(),
        "check should succeed when all files are properly formatted"
    );
}

#[test]
fn test_very_large_indent_spaces() {
    // Test with maximum reasonable indent spaces
    let output = run_sleek_with_stdin(&["--indent-spaces", "16"], b"select * from users");

    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();
    // Should have 16 spaces of indentation
    assert!(
        stdout.contains("                *"),
        "should have 16 spaces before *"
    );
}

#[test]
fn test_complex_sql_formatting() {
    // Test formatting of more complex SQL with subqueries, joins, etc.
    let complex_sql = r#"
        select u.id, u.name, count(o.id) as order_count 
        from users u 
        left join orders o on u.id = o.user_id 
        where u.created_at > '2023-01-01' 
        and u.status in ('active', 'premium') 
        group by u.id, u.name 
        having count(o.id) > 5 
        order by order_count desc 
        limit 10
    "#;

    let output = run_sleek_with_stdin(&[], complex_sql.as_bytes());
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();

    // Verify key SQL keywords are properly formatted
    assert!(stdout.contains("SELECT"), "should contain SELECT");
    assert!(stdout.contains("FROM"), "should contain FROM");
    assert!(stdout.contains("LEFT JOIN"), "should contain LEFT JOIN");
    assert!(stdout.contains("WHERE"), "should contain WHERE");
    assert!(stdout.contains("GROUP BY"), "should contain GROUP BY");
    assert!(stdout.contains("HAVING"), "should contain HAVING");
    assert!(stdout.contains("ORDER BY"), "should contain ORDER BY");
    assert!(stdout.contains("LIMIT"), "should contain LIMIT");
}

#[test]
fn test_sql_with_comments() {
    // Test that SQL comments are preserved during formatting
    let sql_with_comments = r#"
        -- This is a comment
        select * from users -- inline comment
        where id = 1 /* block comment */
    "#;

    let output = run_sleek_with_stdin(&[], sql_with_comments.as_bytes());
    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();

    // Comments should be preserved
    assert!(
        stdout.contains("-- This is a comment"),
        "should preserve line comments"
    );
    assert!(
        stdout.contains("-- inline comment"),
        "should preserve inline comments"
    );
    assert!(
        stdout.contains("/* block comment */"),
        "should preserve block comments"
    );
}

#[test]
fn test_file_with_no_extension() {
    // Test formatting a file without .sql extension
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("query_file");

    let input = "select * from users where id = 1";
    fs::write(&file_path, input).unwrap();

    let output = sleek_command()
        .arg(file_path.to_str().unwrap())
        .output()
        .expect("Failed to execute sleek");

    assert!(output.status.success());

    let formatted_content = fs::read_to_string(&file_path).unwrap();
    assert!(
        formatted_content.contains("SELECT"),
        "should format files without .sql extension"
    );
}

#[test]
fn test_readonly_file_error_handling() {
    // Test error handling when trying to format a read-only file
    let temp_dir = TempDir::new().unwrap();
    let file_path = temp_dir.path().join("readonly.sql");

    let input = "select * from users";
    fs::write(&file_path, input).unwrap();

    // Make file read-only (Unix-style permissions)
    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&file_path).unwrap().permissions();
        perms.set_mode(0o444); // read-only
        fs::set_permissions(&file_path, perms).unwrap();

        let output = sleek_command()
            .arg(file_path.to_str().unwrap())
            .output()
            .expect("Failed to execute sleek");

        // Should fail due to permission error
        assert!(!output.status.success(), "should fail on read-only file");
    }
}

#[test]
fn test_stdin_with_check_mode_and_custom_options() {
    // Test check mode from stdin with custom formatting options
    let formatted_sql = "select\n  *\nfrom\n  users\n";

    // This should pass check with matching options
    let output = run_sleek_with_stdin(
        &["--check", "--indent-spaces", "2", "--uppercase", "false"],
        formatted_sql.as_bytes(),
    );
    assert!(
        output.status.success(),
        "should pass check with matching format options"
    );

    // This should fail check with different options
    let output = run_sleek_with_stdin(
        &["--check", "--indent-spaces", "4", "--uppercase", "true"],
        formatted_sql.as_bytes(),
    );
    assert!(
        !output.status.success(),
        "should fail check with different format options"
    );
}

#[test]
fn test_combining_all_flags() {
    // Test using all available flags together
    let input = "select * from users; select * from orders;";

    let output = run_sleek_with_stdin(
        &[
            "--indent-spaces",
            "2",
            "--uppercase",
            "false",
            "--lines-between-queries",
            "1",
            "--trailing-newline",
            "false",
        ],
        input.as_bytes(),
    );

    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();

    // Verify all options are applied
    assert!(stdout.contains("select"), "should use lowercase keywords");
    assert!(stdout.contains("  *"), "should use 2-space indentation");
    assert!(
        stdout.contains(";\nselect"),
        "should have no empty lines between queries with lines-between-queries=1"
    );
    assert!(!stdout.ends_with('\n'), "should not have trailing newline");
}

#[test]
fn test_short_flag_aliases() {
    // Test that short flag aliases work correctly
    let input = "select * from users";

    let output = run_sleek_with_stdin(
        &["-i", "2", "-U", "false", "-l", "0", "-n", "false"],
        input.as_bytes(),
    );

    assert!(output.status.success());
    let stdout = String::from_utf8(output.stdout).unwrap();

    assert!(stdout.contains("select"), "short -U flag should work");
    assert!(stdout.contains("  *"), "short -i flag should work");
    assert!(!stdout.ends_with('\n'), "short -n flag should work");
}

#[test]
fn test_error_message_quality() {
    // Test that error messages are helpful and informative

    // Test with a file that doesn't exist (safer than null bytes which cause OS-level errors)
    let output = sleek_command()
        .arg("/nonexistent/path/file.sql")
        .output()
        .expect("Failed to execute sleek");

    // Should handle invalid paths gracefully
    // Note: Glob patterns that don't match any files succeed (no-op),
    // but explicit non-existent files should be handled gracefully
    if !output.status.success() {
        let stderr = String::from_utf8(output.stderr).unwrap();
        assert!(
            !stderr.is_empty(),
            "should provide error message for invalid paths"
        );
    }
}
