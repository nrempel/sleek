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
        .arg("--trailing-newline")
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
        .arg("--uppercase")
        .arg("true")
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
