# TSL CLI Reference

## ภาพรวม

TSL CLI เป็น command-line interface สำหรับ TSL Language ให้ commands เพื่อ compile, check และรัน TSL source files

## การติดตั้ง

หลังติดตั้ง TSL แบบ global:

```bash
npm install -g .
```

หรือรันโดยตรงจาก source:

```bash
node src/cli.js
```

## การใช้งาน

### Commands

```
tsl <file.tsl>
tsl build <file.tsl> [-o <output.js>]
tsl check <file.tsl>
tsl --version
```

### Compile และ Run

compile TSL file และพิมพ์ JavaScript ที่สร้างไปยัง stdout:

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

### Compile ไปยังไฟล์

compile TSL file และเขียน JavaScript ที่สร้างไปยัง output file:

```bash
node src/cli.js hello.tsl -o hello.js
```

หรือใช้ build command:

```bash
tsl build hello.tsl -o hello.js
```

Output:

```
Built: hello.tsl -> hello.js
```

### Check

validate TSL file โดยไม่สร้าง output:

```bash
tsl check hello.tsl
```

Output เมื่อสำเร็จ:

```
Check passed: hello.tsl
```

### Version

พิมพ์ TSL version:

```bash
tsl --version
```

Output:

```
TSL v1.0.0
```

## Compilation Pipeline

CLI compile TSL source ผ่าน 4 stages:

1. **Tokenize** — `lexer.tokenize(source, filename)` แปลง source text เป็น tokens
2. **Parse** — `createParser(tokens, source, filename).parseStatements()` สร้าง AST
3. **Validate** — `createValidator(source, filename).validate(ast)` ตรวจสอบ semantic rules
4. **Generate** — `createGenerator(source, filename).generate(ast)` สร้าง JavaScript

## การจัดการ Error

CLI catch และ report errors จากแต่ละ pipeline stage:

| Error Type     | Source        | คำอธิบาย                      |
| -------------- | ------------- | -------------------------------- |
| LexerError     | lexer.js      | Invalid tokens หรือ syntax         |
| ParserError    | parser.js     | โครงสร้าง AST ผิดรูป          |
| ValidationError| validator.js  | การละเมิด semantic rules         |
| GeneratorError | generator.js  | Code generation ล้มเหลว          |

Errors ถูกพิมพ์ไปยัง stderr พร้อม line และ column information:

```
LexerError: Unexpected token 'invalid' at line 3, column 5
```

## Exit Codes

| Code | ความหมาย                    |
| ---- | -------------------------- |
| 0    | สำเร็จ                    |
| 1    | มีข้อผิดพลาด (compilation หรือ I/O) |

## ข้อกำหนดไฟล์

- Source files ต้องมีนามสกุล `.tsl`
- ไฟล์ต้องอยู่บน disk ก่อน compilation
- ไฟล์ต้องอ่านได้เป็น UTF-8 text

## Alternative Entry Points

CLI สามารถ invoke ได้ 2 วิธี:

1. Direct: `node src/cli.js <args>`
2. ผ่าน package bin: `tsl <args>` (หลัง global install)

Entry points ทั้งสอง equivalent กันเต็มที่
