//////////////////////////////
///  yichen

const util = require('./util');

//
// 操作符验证
// 扩展时可根据需求自定义不同的验证(此处可开放给扩展端)
//
// 'schema'     用于对 操作符 定义过程中的验证
//  - name          配置项属性名
//  - normalize     配置项值标准化方法(对未设置配置的项指定默认值或配置值不合格时抛出异常)
// 'validate'   用于运行时对值验证方法(无需验证时可不设置)
//
module.exports = {
    // 验证器名(可用于复用时引用 暂无用)
    'through': {
        schema: {
            name: 'through', normalize: function (value) {
                return util.toBoolean(value, false);
            }
        }
    },
    'parse': {
        schema: {
            name: 'parse', normalize: function (value) {
                if (util.isFunction(value)) return value;
                throw new ArgumentError('parse', `Property 'parse' must be of function.`);
            }
        }
    },
    'single': {
        schema: {
            name: 'single', normalize: function (value) {
                return util.toBoolean(value, false);
            }
        },
        validate: function (schemaSingle, operator, useCount, level, prop, value) {
            return schemaSingle == false || useCount == 0;
        }
    },
    'level': {
        schema: {
            name: 'level', normalize: function (value) {
                return util.toArray(value, true, function (i) {
                    if (util.isNullOrUndefined((i = util.toInt(i))))
                        throw new ArgumentError('level', `Property 'level' must be of Array(int) or undefined.`);
                    return i;
                }, []);
            }
        },
        validate: function (schemaLevels, operator, useCount, level, prop, value) {
            return schemaLevels.length == 0 || util.inArray(schemaLevels, level);
        }
    },
    'siblings': {
        schema: {
            name: 'siblings', normalize: function (value) {
                return util.toArray(value, true, function (i) {
                    if (util.isNullOrUndefined((i = util.isString(i) && i.trim()))
                        && i.length > 0)
                        throw new ArgumentError('siblings', `Property 'siblings' must be of Array(string) or undefined.`);
                    return i;
                }, []);
            }
        },
        validate: function (schemaSiblings, operator, useCount, level, prop, value) {
            return schemaSiblings.length == 0
                || util.inArray(operator.siblings, ...schemaSiblings);
        }
    },
    'parents': {
        schema: {
            name: 'parents', normalize: function (value) {
                return util.toArray(value, true, function (i) {
                    if (util.isNullOrUndefined((i = util.isString(i) && i.trim()))
                        && i.length > 0)
                        throw new ArgumentError('parents', `Property 'parents' must be of Array(string) or undefined.`);
                    return i;
                }, []);
            }
        },
        validate: function (schemaParents, operator, useCount, level, prop, value) {
            return schemaParents.length == 0
                || util.inArray(schemaParents, operator.parent.name);
        }
    },
    'runtimeValidate': {
        schema: {
            name: 'runtimeValidate', normalize: function (value) {
                if (util.isNullOrUndefined(value) || util.isFunction(value)) return value;
                throw new ArgumentError('runtimeValidate', `Property 'runtimeValidate' must be of Function or undefined.`);
            }
        },
        validate: function (schemaRuntimeValidate, operator, useCount, level, prop, value) {
            return util.isFunction(schemaRuntimeValidate) == false
                || schemaRuntimeValidate(value);
        }
    }
};


