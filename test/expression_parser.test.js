//////////////////////////////
///  yichen

const assert = require('assert');
const ExpressionParser = require('../index');

describe('expression_parser.test.js', function () {

    const _c = function (comparisonOperators, logicalOperators, defaultOperator,
        defaultLogicalOperator, arrayValueOperator, operatorIgnorecase) {
        return new ExpressionParser(comparisonOperators, logicalOperators, defaultOperator,
            defaultLogicalOperator, arrayValueOperator, operatorIgnorecase);
    };

    const c = {
        '_><_': function (prop, value, originalOperator, context) {
            return { segment: `${prop} <=> ***`, values: [value] };
        }
    }, l = {
        '&&': function (segments, originalOperator, level, context) {
            let operator = 'and';
            if (segments.length == 1) return segments[0];
            return `(${segments.join(`) ${operator} (`)})`;
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

        let cep = _c(c, l, '_><_', '&&', '_><_');
        let { segment, values } = cep.parse({ '&&': { 'test': 1, 'name': { '_><_': 'a' } } });

        assert(segment == '(test <=> ***) and (name <=> ***)');
        assert(Array.isArray(values));
        assert.deepEqual(values, [1, 'a']);

    });

    it('operator ignorecase', function () {

        const c1 = {
            '&a': function (prop, value, originalOperator, context) {
                return { segment: `${prop} <=> ***`, values: [value] };
            }
        }, l1 = {
            '#b': function (segments, originalOperator, level, context) {
                let operator = 'and';
                if (segments.length == 1) return segments[0];
                return `(${segments.join(`) ${operator} (`)})`;
            }
        };

        let cep = _c(c1, l1, '&a', '#b', '&a', true);
        let { segment, values } = cep.parse({ '#B': { 'test': 1, 'name': { '&A': 'a' } } });

        assert(segment == '(test <=> ***) and (name <=> ***)');
        assert(Array.isArray(values));
        assert.deepEqual(values, [1, 'a']);

    });

    it('context', function () {

        const c1 = {
            '_><_': function (prop, value, originalOperator, context) {
                return { segment: `${context[prop]} <=> ***`, values: [value] };
            }
        }, l1 = {
            '&&': function (segments, originalOperator, level, context) {
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

        // 配置逻辑操作符
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
        assert.deepEqual(values, [ 'yichen', 18, 30, [ 1, 2 ], [ 3, 4 ] ]);


    });




});