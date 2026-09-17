# TSL CLI Reference

## Overview

The TSL CLI is the command-line interface for the TSL Language. It provides commands to compile, check, and run TSL source files.

## Installation

After installing TSL globally:

```bash
npm install -g .
```

Or run directly from source:

```bash
node src/cli.js
```

## Usage

### Commands

```
tsl <file.tsl>
tsl build <file.tsl> [-o <output.js>]
tsl check <file.tsl>
tsl --version
```

### Compile and Run

Compile a TSL file and print the generated JavaScript to stdout:

```bash
node src/cli.js hello.tsl
```

Output:

```
Loaded: hello.tsl
Compilation successful!

--- Generated JavaScript ---
<generated JavaScript>
--- End of Generated Code ---
```

### Compile to File

Compile a TSL file and write the generated JavaScript to an output file:

```bash
node src/cli.js hello.tsl -o hello.js
```

Or using the build command:

```bash
tsl build hello.tsl -o hello.js
```

Output:

```
Built: hello.tsl -> hello.js
```

### Check

Validate a TSL file without generating output:

```bash
tsl check hello.tsl
```

Output on success:

```
Check passed: hello.tsl
```

### Version

Print the TSL version:

```bash
tsl --version
```

Output:

```
TSL v1.0.0
```

## Compilation Pipeline

The CLI compiles TSL source through four stages:

1. **Tokenize** — `lexer.tokenize(source, filename)` converts source text into tokens
2. **Parse** — `createParser(tokens, source, filename).parseStatements()` builds the AST
3. **Validate** — `createValidator(source, filename).validate(ast)` checks semantic rules
4. **Generate** — `createGenerator(source, filename).generate(ast)` produces JavaScript

## Error Handling

The CLI catches and reports errors from each pipeline stage:

| Error Type     | Source        | Description                      |
| -------------- | ------------- | -------------------------------- |
| LexerError     | lexer.js      | Invalid tokens or syntax         |
| ParserError    | parser.js     | Malformed AST structure          |
| ValidationError| validator.js  | Semantic rule violations         |
| GeneratorError | generator.js  | Code generation failure          |

Errors are printed to stderr with line and column information:

```
LexerError: Unexpected token 'invalid' at line 3, column 5
```

## Exit Codes

| Code | Meaning                    |
| ---- | -------------------------- |
| 0    | Success                    |
| 1    | Error (compilation or I/O) |

## File Requirements

- Source files must have `.tsl` extension
- Files must exist on disk before compilation
- Files must be readable as UTF-8 text

## Alternative Entry Points

The CLI can be invoked in two ways:

1. Direct: `node src/cli.js <args>`
2. Via package bin: `tsl <args>` (after global install)

Both entry points are fully equivalent.
