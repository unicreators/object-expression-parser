//////////////////////////////
///  yichen

const assert = require('assert');
const ExpressionParser = require('../index');


describe('expression_parser.test.js', function () {

    const _c = function (comparisonOperators, logicalOperators, defaultOperator,
        defaultLogicalOperator, arrayValueOperator, operatorIgnorecase, unaryOperators) {
        return new ExpressionParser(comparisonOperators, logicalOperators, defaultOperator,
            defaultLogicalOperator, arrayValueOperator, operatorIgnorecase, unaryOperators);
    };

    const c = {
        '_><_': function (prop, value, originalOperator, context) {
            return { segment: `${prop} <=> ***`, values: [value] };
        }
    }, l = {
        '&&': function (expr, segments, originalOperator, level, context) {
            let operator = 'and';
            if (segments.length == 1) return segments[0];
            return `(${segments.join(`) ${operator} (`)})`;
        }
    }, u = {
        '!': function (expr, segment, originalOperator, level, context) {
            return `not(${segment})`;
        },
        '*': {
            through: true,
            parse: function (expr, segment, originalOperator, level, context) {
                return `table(${expr})`;
            }
        }
    };


    it('constructor error (logicalOperators undefined)', function () {

        let t = function () { return _c({}, undefined, '_><_', '&&', '_><_') };
        assert.throws(t, Error);

    });

    it('constructor error (comparisonOperators undefined)', function () {

        let t = function () { return _c(undefined, {}, '_><_', '&&', '_><_') };
        assert.throws(t, Error);

    });


    it('constructor error (defaultOperator, defaultLogicalOperator, arrayValueOperator undefined)', function () {

        let t = function () { return _c(c, l, undefined, '&&', '_><_') };
        assert.throws(t, Error);

        t = function () { return _c(c, l, '_><_', undefined, '_><_') };
        assert.throws(t, Error);

        t = function () { return _c(c, l, '_><_', '&&', undefined) };
        assert.throws(t, Error);

    });


    it('constructor error (defaultOperator, defaultLogicalOperator, arrayValueOperator not found)', function () {

        let t = function () { return _c(c, l, '?', '&&', '_><_') };
        assert.throws(t, Error);

        t = function () { return _c(c, l, '_><_', '?', '_><_') };
        assert.throws(t, Error);

        t = function () { return _c(c, l, '_><_', '&&', '?') };
        assert.throws(t, Error);

    });


    it('constructor', function () {

        let t = _c(c, l, '_><_', '&&', '_><_');

        assert(t);
        assert(t.parse);

    });

    it('parse error (argument)', function () {

        let cep = _c(c, l, '_><_', '&&', '_><_');

        let t = function () { cep.parse(undefined); };
        assert.throws(t, Error);


    });

    it('parse', function () {

        let cep = _c(c, l, '_><_', '&&', '_><_');
        let r = cep.parse({ 'test': 1 })

        assert(r);
        assert(r.segment == 'test <=> ***');
        assert(Array.isArray(r.values));
        assert.deepEqual(r.values, [1]);

    });

    it('parse (empty object)', function () {

        let cep = _c(c, l, '_><_', '&&', '_><_');
        let r = cep.parse({})

        assert(r);
        assert(r.segment == '');
        assert(Array.isArray(r.values));
        assert.deepEqual(r.values, []);

    });

    it('operator', function () {

        let cep = _c(c, l, '_><_', '&&', '_><_', true, u);
        let { segment, values } = cep.parse(
            {
                '!': {
                    '&&': {
                        'test': 1,
                        'name': {
                            '_><_': 'a'
                        },
                        '*': 't_user'
                    }
                }
            });

        assert(segment == 'not((test <=> ***) and (name <=> ***) and (table(t_user)))');
        assert(Array.isArray(values));
        assert.deepEqual(values, [1, 'a']);

    });

    it('operator ignorecase', function () {

        const c1 = {
            '&a': function (prop, value, originalOperator, context) {
                return { segment: `${prop} <=> ***`, values: [value] };
            }
        }, l1 = {
            '#b': function (expr, segments, originalOperator, level, context) {
                if (segments.length == 1) return segments[0];
                return `(${segments.join(`) and (`)})`;
            }
        };

        let cep = _c(c1, l1, '&a', '#b', '&a', true);
        let { segment, values } = cep.parse({ '#B': { 'test': 1, 'name': { '&A': 'a' } } });

        assert(segment == '(test <=> ***) and (name <=> ***)');
        assert(Array.isArray(values));
        assert.deepEqual(values, [1, 'a']);

    });

    it('rule (through)', function () {
        let cep = _c(c, l, '_><_', '&&', '_><_', true,
            {
                '#b': {
                    through: true,
                    parse: function (expr, segment, originalOperator, level, context) {
                        // segment is null  on through                     
                        return `not(${expr.name})`;
                    }
                }
            });


        let { segment, values } = cep.parse({
            'test': 1,
            '#b': {
                'name': 'true'
            }
        });

        assert(segment == '(test <=> ***) and (not(true))');
        assert(Array.isArray(values));


    });

    it('rule (single)', function () {
        let cep = _c(c, l, '_><_', '&&', '_><_', true,
            {
                '#b': {
                    single: true,
                    parse: function (expr, segment, originalOperator, level, context) {
                        return `not(${segment})`;
                    }
                }
            });

        let f = function () {
            cep.parse({
                'test': 1,
                '#b': {
                    '#b': { 'a': 2 }
                }
            });
        };

        assert.throws(f, Error);

    });

    it('rule (level)', function () {
        let cep = _c(c, l, '_><_', '&&', '_><_', true,
            {
                '#b': {
                    level: 1,
                    parse: function (expr, segment, originalOperator, level, context) {
                        return `(${segment})`;
                    }
                }
            });

        let f = function () {
            cep.parse({
                'test': 1,
                '#b': {
                    '#b': { 'a': 2 }
                }
            });
        };

        assert.throws(f, Error);



        cep = _c(c, l, '_><_', '&&', '_><_', true,
            {
                '#b': {
                    level: [1, 2, 3],
                    parse: function (expr, segment, originalOperator, level, context) {
                        return `not(${segment})`;
                    }
                }
            });

        let { segment, values } = cep.parse({
            'test': 1,
            '#b': {
                '#b': { 'a': 2 }
            }
        });

        assert(segment);
        assert(Array.isArray(values));


        cep = _c(c, l, '_><_', '&&', '_><_', true,
            {
                '#b': {
                    level: [2, 3],
                    parse: function (expr, segment, originalOperator, level, context) {
                        return `not(${segment})`;
                    }
                }
            });

        f = function () {
            cep.parse({
                'test': 1,
                '#b': {
                    '#b': { 'a': 2 }
                }
            });
        };

        assert.throws(f, Error);

    });

    it('rule (siblings)', function () {
        let cep = _c(c, l, '_><_', '&&', '_><_', true,
            {
                '#b': {
                    siblings: ['_><_'],
                    parse: function (expr, segment, originalOperator, level, context) {
                        return `not(${segment})`;
                    }
                }
            });

        let f = function () {
            cep.parse({
                'test': 1,
                '#b': { 'a': 2 }
            });
        };

        assert.throws(f, Error);

    });

    it('rule (runtimeValidate)', function () {
        let cep = _c(c, l, '_><_', '&&', '_><_', true,
            {
                '#b': {
                    runtimeValidate: function (val) { return typeof val === 'string'; },
                    parse: function (expr, segment, originalOperator, level, context) {
                        return `not(${segment})`;
                    }
                }
            });

        let f = function () {
            cep.parse({
                'test': 1,
                '#b': { 'a': 2 }
            });
        };

        assert.throws(f, Error);

    });

    it('rule (all)', function () {
        let cep = _c(c, l, '_><_', '&&', '_><_', true,
            {
                '#b': {
                    single: true,
                    value: function (val) { return typeof val === 'string'; },
                    level: [1],
                    required: ['&&'],
                    parse: function (expr, segment, originalOperator, level, context) {
                        return `not(${segment})`;
                    }
                }
            });

        let f = function () {
            cep.parse({
                'test': 1,
                '#b': { '#b': { 'a': 2 } }
            });
        };

        assert.throws(f, Error);

        let { segment, values } = cep.parse({
            'test': 1,
            '#b': 'a',
            '&&': { 'x': 1 }
        });

        assert(segment);
        assert(Array.isArray(values));

    });



    it('context', function () {

        const c1 = {
            '_><_': function (prop, value, originalOperator, level, context) {
                return { segment: `${context[prop]} <=> ***`, values: [value] };
            }
        }, l1 = {
            '&&': function (expr, segments, originalOperator, level, context) {
                let operator = 'and';
                if (segments.length == 1) return segments[0];
                return `(${segments.join(`) ${operator} (`)})`;
            }
        };

        let cep = _c(c1, l1, '_><_', '&&', '_><_'),
            e = { '&&': { 'userId': 'u1', 'displayName': { '_><_': 'a' } } };

        let context = { 'userId': 'user_id', 'displayName': 'display_name' };
        let { segment, values } = cep.parse(e, context);

        assert(segment == '(user_id <=> ***) and (display_name <=> ***)');
        assert(Array.isArray(values));
        assert.deepEqual(values, ['u1', 'a']);

    });




    it('all', function () {

        // 配置比较操作符
        let c = {
            '$gt':
            {
                // 当设置值为true时将不解析子对象
                through: false,
                // 当设置值为true时此操作符只可出现一次
                single: false,
                // 限定同级操作符必须包括数组中指定的全部操作符
                siblings: [],
                // 限定父级操作符必须为数组中指定操作符中的一个
                parents: [],
                // 限定操作符在指定的层级(level)中使用
                level: [1, 2, 3],
                // 自定义对运行时值的验证
                runtimeValidate: function (value) {
                    return true;
                },
                // 核心转换方法
                parse: function (prop, value, originalOperator, context) {
                    return { segment: `${prop} > ?`, values: [value] };
                }
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

        // 配置逻辑操作符
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

        // 当未指明比较操作符时视为使用 $eq 处理
        let defaultOperator = '$eq';

        // 当未指明逻辑操作符时视为使用 && 处理
        let defaultLogicalOperator = '&&';

        // 当未指明比较操作符且值为数组时使用 $in 处理
        let arrayValueOperator = '$in';

        // 设置操作符忽略大小写
        let operatorIgnorecase = true;

        let ep = new ExpressionParser(c, l, defaultOperator, defaultLogicalOperator, arrayValueOperator, operatorIgnorecase);

        let e = {
            'name': 'yichen',
            age: { '$gt': 18, '$lt': 30 },
            '||': { 'level': [1, 2], 'age': { '$in': [3, 4] } }
        };

        let { segment, values } = ep.parse(e);

        assert(segment == '(name = ?) and ((age > ?) and (age < ?)) and ((level in (?)) or (age in (?)))');
        assert(Array.isArray(values));
        assert.deepEqual(values, ['yichen', 18, 30, [1, 2], [3, 4]]);


    });




});