# Testing Guide for Sleek SQL Formatter Extension

## Prerequisites

1. **Install Sleek CLI:**

   ```bash
   cargo install sleek
   ```

2. **Verify Sleek installation:**

   ```bash
   sleek --version
   ```

## Testing Steps

### 🚀 **Step 1: Launch Extension Development Host**

1. Open this project in Cursor
2. Press `F5` or use Command Palette → "Debug: Start Debugging"
3. A new Cursor window will open with "[Extension Development Host]" in the title
4. Your extension is now loaded and active in this window

### 📝 **Step 2: Basic Functionality Tests**

#### **A. Document Formatting**

1. Open `test-samples/sample.sql` in the Extension Development Host
2. Press `Shift+Alt+F` (or `Cmd+Shift+P` → "Sleek: Format Document")
3. **Expected:** SQL should be formatted with proper indentation and structure

#### **B. Selection Formatting**

1. Select part of the SQL in `sample.sql`
2. Right-click → "Format Selection" (or Command Palette → "Sleek: Format Selection")
3. **Expected:** Only selected text should be formatted

#### **C. Check Formatting**

1. Command Palette → "Sleek: Check Formatting"
2. **Expected:** Shows if SQL is properly formatted with option to format if needed

#### **D. Status Bar Integration**

1. Look at bottom-right corner of Cursor
2. **Expected:**
   - ✅ `$(check) Sleek` = Already formatted
   - ⚠️ `$(warning) Sleek` = Needs formatting
   - ❌ `$(error) Sleek` = Error occurred

#### **E. Context Menu**

1. Right-click in a SQL file
2. **Expected:** See "Format Document" and "Format Selection" options

### ⚙️ **Step 3: Configuration Tests**

#### **A. Settings Configuration**

1. Open Cursor Settings (`Cmd+,`)
2. Search for "sleek"
3. Test changing these settings:
   - `sleek.indentSpaces`: Try 2, 4, 8
   - `sleek.uppercase`: Toggle true/false
   - `sleek.linesBetweenQueries`: Try 0, 1, 2, 3

#### **B. Format on Save**

1. Enable `sleek.formatOnSave: true`
2. Make changes to SQL file and save (`Cmd+S`)
3. **Expected:** File should auto-format on save

#### **C. Format on Paste**

1. Enable `sleek.formatOnPaste: true`
2. Copy unformatted SQL and paste it
3. **Expected:** Pasted SQL should auto-format

### 🧪 **Step 4: Advanced Tests**

#### **A. Complex SQL (use complex.sql)**

1. Open `test-samples/complex.sql`
2. Test formatting on various SQL constructs:
   - CTEs (Common Table Expressions)
   - Window functions
   - Subqueries
   - JOINs
   - CASE statements

#### **B. Error Handling**

1. Test with invalid SQL syntax
2. Test with missing Sleek executable (temporarily rename/move sleek)
3. **Expected:** Graceful error messages, no crashes

#### **C. Large Files**

1. Create a large SQL file (>1000 lines)
2. Test formatting performance
3. **Expected:** Should handle reasonably within timeout (30s)

### 🎯 **Step 5: Edge Cases**

#### **A. Empty Files**

1. Create empty `.sql` file
2. Test all commands
3. **Expected:** No errors, graceful handling

#### **B. Mixed Content**

1. Create file with SQL + comments + whitespace
2. Test formatting
3. **Expected:** Preserves comments, handles whitespace correctly

#### **C. Different File Extensions**

1. Test with `.SQL` (uppercase)
2. Test with other extensions
3. **Expected:** Works with .sql files, ignores others

## Debugging

### **Console Output**

1. Open Developer Tools (`Cmd+Option+I`)
2. Check Console for any errors or warnings
3. Look for "Sleek SQL Formatter extension activated" message

### **Output Panel**

1. View → Output
2. Select "Extension Host" from dropdown
3. Check for extension-related messages

## Expected Formatting Examples

### **Before:**

```sql
select id, name, email from users where id in (select user_id from orders where total > 100) and status = 'active'
```

### **After:**

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

## Troubleshooting

### **"Sleek executable not found"**

- Ensure Sleek is installed: `cargo install sleek`
- Check PATH or set full path in settings
- Restart Extension Development Host

### **Formatting fails**

- Check SQL syntax validity
- Verify Sleek works from command line
- Check timeout settings for large files

### **Extension not loading**

- Check Console for errors
- Verify compilation: `npm run compile`
- Restart Extension Development Host

## Performance Expectations

- **Small files (<100 lines):** Instant formatting
- **Medium files (100-1000 lines):** <2 seconds
- **Large files (1000+ lines):** <10 seconds
- **Timeout:** 30 seconds maximum
