# Arrays

Arrays เป็น ordered collections ของค่าใน TSL

## Array Literals

สร้าง array ด้วย square brackets:

```tsl
numbers = [1, 2, 3, 4, 5]
```

```js
let numbers = [1, 2, 3, 4, 5];
```

Elements สามารถเป็น expression ใดๆ ก็ได้:

```tsl
mixed = [1, "hello", true]
```

```js
let mixed = [1, "hello", true];
```

## Nested Arrays

Arrays สามารถ contain arrays อื่นๆ ได้:

```tsl
matrix = [[1, 2], [3, 4]]
```

```js
let matrix = [[1, 2], [3, 4]];
```

## การเข้าถึง Array

เข้าถึง element ด้วย index ด้วย square brackets Indices เริ่มจาก 0:

```tsl
first = numbers[0]
second = numbers[1]
```

```js
let first = numbers[0];
let second = numbers[1];
```

## การกำหนดค่า Array

กำหนดค่าให้ element ด้วย index:

```tsl
numbers[0] = 10
numbers[4] = 50
```

```js
numbers[0] = 10;
numbers[4] = 50;
```

## การวนซ้ำ

วนซ้ำผ่าน array elements ด้วย `for-in`:

```tsl
numbers = [1, 2, 3, 4, 5]
total = 0

for num in numbers:
    total = total + num

print(total)
```

```js
let numbers = [1, 2, 3, 4, 5];
let total = 0;
for (const num of numbers) {
  total = total + num;
}
console.log(total);
```
