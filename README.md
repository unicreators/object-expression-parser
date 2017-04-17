## ExpressionParser

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


## 自定义一个语法转换器

#### 配置比较操作符

- 配置支持 >、<、=、in 的比较操作符。

```js
let c = {
    '$gt': function (prop, value, originalOperator, context) {
        return { segment: `${prop} > ?`, values: [value] };
    },
    '$lt': function (prop, value, originalOperator, context) {
        return { segment: `${prop} < ?`, values: [value] };
    },
    '$eq': function (prop, value, originalOperator, context) {
        return { segment: `${prop} = ?`, values: [value] };
    },
    '$in': function (prop, value, originalOperator, context) {
        return { segment: `${prop} in (?)`, values: [value] };
    }
};
```

#### 配置逻辑操作符

- 配置支持 and、or 的逻辑操作符。


```js
let l = {
    '&&': function (segments, originalOperator, level, context) {
        if (segments.length == 1) return segments[0];
        return `(${segments.join(`) and (`)})`;
    },
    '||': function (segments, originalOperator, level, context) {
        if (segments.length == 1) return segments[0];
        return `(${segments.join(`) or (`)})`;
    }
};
```


#### 其它配置


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


#### 构建 ExpressionParser 实例

- 使用配置参数构建 ExpressionParser 实例


```js
let expressionParser = new ExpressionParser(c, l, 
                    defaultOperator, defaultLogicalOperator, 
                    arrayValueOperator, operatorIgnorecase);
```



#### 转换表达式


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





#### ExpressionParser 构造

```js
/**
* 
* @param {Object} comparisonOperators 
* 配置比较操作符及对应处理方法
* 处理方法原型 (prop, value, originalOperator, context) => { segment, values }
* 
* @param {Object} logicalOperators 
* 配置逻辑操作符及对应处理方法
* 处理方法原型 (segments, originalOperator, level, context) => String
* 
* @param {String} defaultOperator 
* 指定当未指明比较操作符时所使用的操作符, 此操作符必须存在于配置(comparisonOperators)中。
* 对应表达式如 { prop: 10 } 
* 
* @param {String} defaultLogicalOperator 
* 指定当未指明逻辑操作符时所使用的操作符, 此操作符必须存在于配置(logicalOperators)中。
* 对应表达式如 { prop: { '>': 1, '<': 10 } } 
* 
* @param {String} arrayValueOperator 
* 指定当值为数组时所使用的操作符, 此操作符必须存在于配置(comparisonOperators)中。
* 对应表达式如 { prop: [1, 2, 4, 8] } 
* 
* @param {Boolean} operatorIgnorecase
* 操作符是否忽略大小写, 默认true
*/
constructor (comparisonOperators, logicalOperators, defaultOperator,
        defaultLogicalOperator, arrayValueOperator, operatorIgnorecase = true) {

}

```


#### ExpressionParser.parse 方法

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





### License

[MIT](LICENSE)