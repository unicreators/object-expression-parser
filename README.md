## ObjectExpressionParser

一个支持自定义操作符的 javascript 对象表达式转换器，可根据自定义的操作符生成不同语法。
  
```js
let e = {
    'name': 'yichen',
    age: { '$gt': 18, '$lt': 30 },
    '||': { 'level': [1, 2], 'age': { '$in': [3, 4] } }
};

let { segment, values } = expressionParser.parse(e);


console.log(segment);
// (name = ?) and ((age > ?) and (age < ?)) and ((level in (?)) or (age in (?)))

console.log(values);
// [ 'yichen', 18, 30, [ 1, 2 ], [ 3, 4 ] ]

```
  
  
## Install

```sh
$ npm install object-expression-parser
```
  
  
## Usage

### 配置比较操作符

- 配置支持 >、<、=、in 的比较操作符。

```js
let c = {
    '$gt': {          
        through: false,
        // more attribute..        
        parse: function (prop, value, originalOperator, level, context) {
            return { segment: `${prop} > ?`, values: [value] };
        }
    },
    '$lt': function (prop, value, originalOperator, level, context) {
        return { segment: `${prop} < ?`, values: [value] };
    },
    '$eq': function (prop, value, originalOperator, level, context) {
        return { segment: `${prop} = ?`, values: [value] };
    },
    '$in': function (prop, value, originalOperator, level, context) {
        return { segment: `${prop} in (?)`, values: [value] };
    }
};
```
  
  
### 配置逻辑操作符

- 配置支持 and、or 的逻辑操作符。


```js
let l = {
    '&&': function (expr, segments, originalOperator, level, context) {
        if (segments.length == 1) return segments[0];
        return `(${segments.join(`) and (`)})`;
    },   
    '||': function (expr, segments, originalOperator, level, context) {
        if (segments.length == 1) return segments[0];
        return `(${segments.join(`) or (`)})`;
    }
};
```
  
  
### 配置一元操作符

- 配置支持 not 的一元操作符。


```js
let u = {
    '$not': function (expr, segment, originalOperator, level, context) {            
        return `not(${segment})`;
    }
    
};
```
  
  
### 其它配置


```js
// 当未指明比较操作符时视为使用 $eq 处理
let defaultOperator = '$eq';

// 当未指明逻辑操作符时视为使用 && 处理
let defaultLogicalOperator = '&&';

// 当未指明比较操作符且值为数组时使用 $in 处理
let arrayValueOperator = '$in';

// 设置操作符忽略大小写
let operatorIgnorecase = true;
```
  
  
### 构建 ObjectExpressionParser 实例

- 使用配置参数构建 ObjectExpressionParser 实例    


```js
let expressionParser = new ObjectExpressionParser(c, l, 
                    defaultOperator, defaultLogicalOperator, 
                    arrayValueOperator, operatorIgnorecase, u);
```
  
  
### 转换表达式


```js
let e = {
    'name': 'yichen',
    age: { '$gt': 18, '$lt': 30 },
    '||': { 'level': [1, 2], 'age': { '$in': [3, 4] } }
};

let { segment, values } = expressionParser.parse(e);


console.log(segment);
// (name = ?) and ((age > ?) and (age < ?)) and ((level in (?)) or (age in (?)))

console.log(values);
// [ 'yichen', 18, 30, [ 1, 2 ], [ 3, 4 ] ]

```
  
  
## Operator attributes  


| attribute     | type                      | required  | default   | desc    |
|:---           | :---                      | :---      | :---      | :---    |
| `parse`       | `Function`                | `yes`     |           | 表达式核心转换方法，用于将对象(表达式)转换成字符串
| `through`     | `Boolean`                 |           | `False`   | 设置操作符不解析子对象(表达式)，而是将子对象(表达式)直接传递给`parse`方法
| `priority`    | `Int`                     |           |           | 操作符优先级(同级多个操作符解析时，此数值小的优先解析)
| `single`      | `Boolean`                 |           | `False`   | 限定操作符仅可在被解析对象(表达式)中出现一次
| `level`       | `Int, [Int]`                     |           |           | 限定操作符在对象(表达式)中的层级 
| `children`    | `Object`                  |
| - `only`      | `Boolean`                 |           | `False`   | 全称`useOperatorOnly`, 限定子级对象(表达式)中仅可使用操作符
| - `required`  | `String, [String]`         |           |           | 限定子级对象(表达式)中必须包括此列表中指定的操作符
| - `optional`  | `String, Object, [String], [Object]`  |           |           | 限定子级对象(表达式)中除`required`列表中指定的操作符之外，只可使用此列表中指定的操作符
| -- `name`     | `String`                  | `yes`     |           | 操作符名称
| -- `autoParse`| `Boolean`                 |           | `False`   | 指定当对象(表达式)中未包含`name`中指定的操作符时，是否自动执行此操作符的转换操作
| -- `defaultTo`| `Any`                     |           |           | 指定当`autoParse`为`true`时，执行转换操作传递给`parse`的对象(表达式)或值
| `siblings`    | `String, [String]`         |           |           | 限定同级对象(表达式)中必须包括此列表中指定的操作符
| `parents`     | `String, [String]`         |           |           | 限定父级操作符必须为`parents`列表中的一个
| `runtimeValidate` | `Function`            |           |           | 自定义运行时对象(表达式)或值的验证方法

  
  
## Attribute 'parse' method
- 表达式核心转换方法
  
### ComparisonOperator
  

```js
function(prop, value, originalOperator, level, context) { 
	// segment, values 
	return { segment: '', values: [] };
}
```


| argument              | type      | desc  |
|:---                   | :---      | :---  |
| `prop`                | `String`  | 要转换的属性名称
| `value`               | `Any`     | 要转换的属性值
| `originalOperator`    | `String`  | 原始操作符
| `level`               | `Int`     | 要转换的属性在对象(表达式)中所处的层级
| `context`             | `Any`     | 惯穿全局的上下文对象(由`ObjectExpressionParser.parse`方法传入)

  
  
### LogicalOperator


```js
function(expr, segments, originalOperator, level, context) { 
	// segment, values 
	return { segment: '', values: [] };
}
```


| argument              | type      | desc  |
|:---                   | :---      | :---  |
| `expr`                | `Any`     | 原始的对象(表达式)
| `segments`            | `[String]`| 转换后的子级对象(表达式)片段, 当操作符属性(attribute)`through`为`True`时，此参数值为`undefined`
| `originalOperator`    | `String`  | 原始操作符
| `level`               | `Int`     | 要转换的属性在对象(表达式)中所处的层级
| `context`             | `Any`     | 惯穿全局的上下文对象(由 `ObjectExpressionParser.parse`方法传入)

  
    
### UnaryOperator


```js
function(expr, segment, originalOperator, level, context) { 
	// segment, values 
	return { segment: '', values: [] };
}
```
  

| argument              | type      | desc  |
|:---                   | :---      | :---  | 
| `expr`                | `Any`     | 原始的对象(表达式)
| `segment`             | `[String]`| 转换后的子级对象(表达式)片段, 当操作符属性(attribute)`through`为`True`时，此参数值为`undefined`
| `originalOperator`    | `String`  | 原始操作符
| `level`               | `Int`     | 要转换的属性在对象(表达式)中所处的层级
| `context`             | `Any`     | 惯穿全局的上下文对象(由 `ObjectExpressionParser.parse`方法传入)

  
  
## ObjectExpressionParser 构造

```js
/**
* 
* @param {Object} comparisonOperators 
* 配置比较操作符及对应处理方法
* @param {Object} logicalOperators 
* 配置逻辑操作符及对应处理方法
* @param {String} defaultOperator 
* 指定当未指明比较操作符时所使用的操作符, 此操作符必须存在于配置(comparisonOperators)中。
* 对应表达式如 { prop: 10 } 
* @param {String} defaultLogicalOperator 
* 指定当未指明逻辑操作符时所使用的操作符, 此操作符必须存在于配置(logicalOperators)中。
* 对应表达式如 { prop: { '>': 1, '<': 10 } } 
* @param {String} arrayValueOperator 
* 指定当值为数组时所使用的操作符, 此操作符必须存在于配置(comparisonOperators)中。
* 对应表达式如 { prop: [1, 2, 4, 8] } 
* @param {Boolean} operatorIgnorecase
* 操作符是否忽略大小写, 默认true
* @param {Object} unaryOperators
* 配置一元操作符及对应处理方法
*/
constructor (comparisonOperators, logicalOperators, defaultOperator,
        defaultLogicalOperator, arrayValueOperator, operatorIgnorecase = true, unaryOperators = undefined) {

}

```
  
  
### ObjectExpressionParser.parse 方法

```js
/**
* 
* @param {Object} expr
* 要转换的对象
*
* @param {Object} context 
* 上下文对象, 此对象将被传递至操作符处理方法中
*
* @returns {Object}
* { segment: '...', values: [] }
*/
parse(expr, context = undefined) {
    //...
}

```


```js
let { segment, values } = expressionParser.parse({ 'name': 'a' });
```
  
  

## License

[MIT](LICENSE)