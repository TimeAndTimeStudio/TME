# Objects

Objects are collections of key-value pairs. Keys are strings. Values can be any expression.

## Creating Objects

Use curly braces with quoted keys.

```tsl
obj = { "key": value }
```

Generates:

```js
let obj = { "key": value };
```

### Example

```tsl
player = { "name": "Alice", "score": 100 }
```

Generates:

```js
let player = { "name": "Alice", "score": 100 };
```

## Nested Objects

Objects can contain other objects.

```tsl
config = {
    "server": { "host": "localhost", "port": 8080 }
}
```

Generates:

```js
let config = { "server": { "host": "localhost", "port": 8080 } };
```

## Member Access

Access object properties with dot notation.

```tsl
name = player.name
```

Generates:

```js
name = player.name;
```

### Example

```tsl
player = { "name": "Alice", "score": 100 }
print(player.name)
```

Generates:

```js
let player = { "name": "Alice", "score": 100 };
console.log(player.name);
```

## Member Assignment

Assign to object properties with dot notation.

```tsl
player.name = "TSL"
```

Generates:

```js
player.name = "TSL";
```

### Example

```tsl
player = { "name": "Alice", "score": 100 }
print(player.name)
player.score = 200
print(player.score)
```

Generates:

```js
let player = { "name": "Alice", "score": 100 };
console.log(player.name);
player.score = 200;
console.log(player.score);
```

## Chained Member Access

Chain property access through nested objects.

```tsl
value = obj.prop1.prop2
```

Generates:

```js
value = obj.prop1.prop2;
```

### Example

```tsl
config = { "server": { "host": "localhost", "port": 8080 } }
host = config.server.host
```

Generates:

```js
let config = { "server": { "host": "localhost", "port": 8080 } };
let host = config.server.host;
```
