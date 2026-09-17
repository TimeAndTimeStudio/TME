# Arrays

Arrays are ordered collections of values in TSL.

## Array Literals

Create an array with square brackets:

```tsl
numbers = [1, 2, 3, 4, 5]
```

```js
let numbers = [1, 2, 3, 4, 5];
```

Elements can be any expression:

```tsl
mixed = [1, "hello", true]
```

```js
let mixed = [1, "hello", true];
```

## Nested Arrays

Arrays can contain other arrays:

```tsl
matrix = [[1, 2], [3, 4]]
```

```js
let matrix = [[1, 2], [3, 4]];
```

## Array Access

Access an element by index with square brackets. Indices are zero-based:

```tsl
first = numbers[0]
second = numbers[1]
```

```js
let first = numbers[0];
let second = numbers[1];
```

## Array Assignment

Assign to an element by index:

```tsl
numbers[0] = 10
numbers[4] = 50
```

```js
numbers[0] = 10;
numbers[4] = 50;
```

## Iteration

Iterate over array elements with `for-in`:

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
