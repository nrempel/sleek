# Change Log

All notable changes to the "sleek-sql-formatter" extension will be documented in this file.

## [0.2.3] - 2024-12-19

### Fixed

- Fixed extension breaking when latest GitHub release is a VSCode extension release
- Extension now correctly filters CLI releases from mixed release types
- Improved release detection logic to handle repositories with both CLI and extension releases
- Added comprehensive test coverage for release filtering functionality

### Technical Changes

- Modified `fetchReleaseData` to fetch all releases instead of just latest
- Added `findLatestCliRelease` method to identify and sort CLI releases
- Enhanced error handling for mixed release scenarios

## [0.2.2] - 2024-12-19

### Added

- Automatic CLI download functionality - extension now downloads Sleek CLI automatically if not found
- Auto-update checking - checks for Sleek CLI updates every 24 hours
- Version management commands for viewing current version and update notifications
- Debug info command for troubleshooting
- Enhanced error handling and user feedback
- Improved executable selection logic with version prioritization

### Enhanced

- Better status bar integration with real-time updates
- Improved configuration handling
- Enhanced cross-platform support
- More robust error handling and recovery

### Commands Added

- `Sleek: Download CLI` - Manually download/update Sleek CLI
- `Sleek: Check for Updates` - Check for available CLI updates
- `Sleek: Show Version Info` - Display current Sleek CLI version
- `Sleek: Debug Info` - Show debugging information

## [0.1.0] - 2024-01-01

### Added

- Initial release of Sleek SQL Formatter for VSCode
- Document formatting for SQL files
- Selection formatting for SQL code
- Format on save option
- Format on paste option
- Check formatting command
- Status bar integration showing formatting status
- Configurable settings matching Sleek CLI options
- Context menu integration
- Keyboard shortcuts for formatting
- Error handling and user feedback

### Features

- Support for all Sleek CLI formatting options
- Real-time status updates in status bar
- Seamless integration with VSCode's formatting system
- Cross-platform support (Windows, macOS, Linux)
