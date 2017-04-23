//////////////////////////////
///  yichen

const util = require('./base/util');

const requiredString = function (value, propertyName) {
    if (util.isString(value) == false || ((value = value.trim()) && false) || value.length == 0)
        throw new ArgumentError(propertyName, `Property '${propertyName}' must be of Array(string) or undefined.`);
    return value;
}

//
// 操作符属性
// 扩展时可根据需求自定义不同的属性(此处可开放给扩展端)
//
//  normalize  属性值标准化方法(对未设置的属性指定默认值或属性值不合格时抛出异常)
//  validate   用于运行时对值验证方法(无需验证时可不设置)
//
module.exports = {
    // 设置操作符不解析子对象(表达式)，而是将子对象(表达式)直接传递给parse方法
    'through': {
        normalize: function (value) {
            return util.toBoolean(value, false);
        }
    },
    // 表达式核心转换方法，用于将对象(表达式)转换成字符串
    'parse': {
        normalize: function (value) {
            if (util.isFunction(value)) return value;
            throw new ArgumentError('parse', `Property 'parse' must be of function.`);
        }
    },
    // 操作符优先级(同级多个操作符解析时，此数值小的优先解析)
    'priority': {
        normalize: function (value) {
            return util.toInt(value, 0, undefined, Number.MAX_VALUE);
        }
    },
    // 限定操作符仅可在被解析对象(表达式)中出现一次
    'single': {
        normalize: function (value) {
            return util.toBoolean(value, false);
        },
        validate: function (schemaSingle, operator, useCount, level, prop, value) {
            return schemaSingle == false || useCount == 0;
        }
    },
    // 限定操作符在对象(表达式)中的层级
    'level': {
        normalize: [function (value) {
            if (util.isNullOrUndefined((value = util.toInt(value))))
                throw new ArgumentError('level', `Property 'level' must be of Array(int) or undefined.`);
            return value;
        }],
        validate: function (schemaLevels, operator, useCount, level, prop, value) {
            return schemaLevels.length == 0 || util.inArray(schemaLevels, level);
        }
    },
    // 限定子级对象(表达式)
    /*
        children: {
        only: true,
        required: ['..'],
        optional: ['..', '..', {name: '..', defaultTo: 1, autoParse: true }]
    }*/
    'children': {
        normalize: {
            schema: {
                // 全称'useOperatorOnly'
                // 限定子级对象(表达式)中仅可使用操作符
                only: function (value) { return util.toBoolean(value, false); },
                // 限定子级对象(表达式)中必须包括'required'列表中指定的操作符
                required: [function (value) { return requiredString(value, 'required'); }],
                // 限定子级对象(表达式)中除'required'列表中指定的操作符之外，只可使用'optional'列表中指定的操作符
                optional: [{
                    schema: {
                        // 操作符名称
                        name: function (value) { return requiredString(value, 'name'); },
                        // 指定当对象(表达式)中未包含'name'中指定的操作符时，是否自动执行此操作符的转换操作
                        autoParse: function (value) { return util.toBoolean(value, false); },
                        // 指定当'autoParse'为true时，执行转换操作传递给'parse'的对象(表达式)或值
                        defaultTo: function (value) { return value; }
                    },
                    defaultProperty: 'name'
                }]
            },
            defaultProperty: 'required'
        },
        validate: function (schemaChildren, operator, useCount, level, prop, value) {
            // 必须包括'required'列表中指定的操作符
            if (schemaChildren.required.length > 0
                && util.inArray(schemaChildren.required, ...operator.children.operators) == false)
                return false;
            // 只能使用操作符属性(不允许使用普通属性)
            if (schemaChildren.only && operator.children.properties.length > 0)
                return false;
            // 除'required'列表中指定的操作符之外，只可使用'optional'列表中指定的操作符
            if (schemaChildren.optional.length > 0) {
                let optional = schemaChildren.optional.map(function (o) { return o.name; });
                return operator.children.operators.every(function (operator) {
                    return (schemaChildren.required.indexOf(operator) == -1
                        && optional.indexOf(operator) == -1);
                });
            }
            return true;
        }
    },
    // 限定同级对象(表达式)中必须包括'siblings'列表中指定的操作符
    'siblings': {
        normalize: [function (value) { return requiredString(value, 'siblings'); }],
        validate: function (schemaSiblings, operator, useCount, level, prop, value) {
            return schemaSiblings.length == 0
                || util.inArray(operator.siblings.operators, ...schemaSiblings);
        }
    },
    // 限定父级操作符必须为'parents'列表中的一个
    'parents': {
        normalize: [function (value) { return requiredString(value, 'parents'); }],
        validate: function (schemaParents, operator, useCount, level, prop, value) {
            return schemaParents.length == 0
                || util.inArray(schemaParents, operator.parent.name);
        }
    },
    // 自定义运行时对象(表达式)或值的验证方法
    'runtimeValidate': {
        normalize: function (value) {
            if (util.isNullOrUndefined(value) || util.isFunction(value)) return value;
            throw new ArgumentError('runtimeValidate', `Property 'runtimeValidate' must be of Function or undefined.`);
        },
        validate: function (schemaRuntimeValidate, operator, useCount, level, prop, value) {
            return util.isFunction(schemaRuntimeValidate) == false
                || schemaRuntimeValidate(value);
        }
    }
};


