//////////////////////////////
///  yichen

const util = require('./util');

const {
    ArgumentError,
    OperatorError,
    OperatorConfigurationError,
    OperatorNotFoundError,
    IncongruentRuleError
} = require('./error'),
    validators = require('./validators'),
    Normalizer = require('./normalizer');

const OperatorType = {
    Comparison: 'Comparison', Logical: 'Logical', Unary: 'Unary'
},
    OperatorTypes = {
        Comparison: function (parse, through, operator, expr, prop, value, level, context) {
            return this.runParse(parse, prop, value, operator, context);
        },
        Logical: function (parse, through, operator, expr, prop, value, level, context) {
            if (through) return this.runParse(parse, expr, undefined, operator, level, context);
            let self = this; level++;
            let { segments, values } = Object.keys(expr).reduce(function (prev, key) {
                let { segment, values } = self.dispatch(key, expr[key], prop, level, context, expr, operator);
                return { segments: util.concatArray(prev.segments, segment), values: util.concatArray(prev.values, ...values) };
            }, { segments: [], values: [] });
            if (segments.length == 0) return { segment: '', values };
            let _result = this.runParse(parse, expr, segments, operator, level, context);
            return { segment: _result.segment, values: util.concatArray(values, ..._result.values) };
        },
        Unary: function (parse, through, operator, expr, prop, value, level, context) {
            if (through) return this.runParse(parse, expr, undefined, operator, level, context);
            let { segment, values } = this.parse(expr, prop, value, level, context);
            let _result = this.runParse(parse, expr, segment, operator, level, context);
            return { segment: _result.segment, values: util.concatArray(values, ..._result.values) };
        }
    };

const OperatorTypeKeys = Object.keys(OperatorTypes);

//
// 构建对象标准化器
// 
// 1. 定义标准化模型
const normalizeSchema = Object.keys(validators).reduce(function (result, validatorName) {
    schema = validators[validatorName].schema;
    if (util.isNullOrUndefined(schema) == false)
        result[validatorName] = schema.normalize;
    return result;
}, {});
//
// 2. 指定当被标准化的值非对象(Object)时将其包装成对象，并将值分配给'parse'属性
const defaultNormalizeProperty = 'parse';
//
// 3. 使用标准化模型创建标准化器
const normalizer = new Normalizer(normalizeSchema, defaultNormalizeProperty);


// 定义运行时值验证器
const runtimeValidators = Object.keys(validators).reduce(function (result, validatorName) {
    let validator = validators[validatorName];
    schema = validator.schema;
    validate = validator.validate;
    if (util.isNullOrUndefined(schema) == false && util.isFunction(validate))
        result[schema.name] = validate;
    return result;
}, {});

const runtimeValidatorKeys = Object.keys(runtimeValidators);



module.exports = class ObjectExpressionParser {

    constructor(comparisonOperators, logicalOperators, defaultOperator,
        defaultLogicalOperator, arrayValueOperator, operatorIgnorecase = true, unaryOperators = undefined) {

        unaryOperators = unaryOperators || {};
        if (util.isObject(comparisonOperators) == false)
            throw new ArgumentError('comparisonOperators');
        if (util.isObject(logicalOperators) == false)
            throw new ArgumentError('logicalOperators');
        if (util.isObject(unaryOperators) == false)
            throw new ArgumentError('unaryOperators');

        this.operatorIgnorecase = !!operatorIgnorecase;

        let proxy = function (...args) { return this._run(this.defaultLogicalOperator, ...args); };
        // bind this
        this.operatorTypeFnContext = {
            runParse: this._run_parse.bind(this),
            dispatch: this._dispatch.bind(this),
            parse: proxy.bind(this)
        };


        let normalize = function (normalizer, operatorsSource, operatorIgnorecase) {
            return Object.keys(operatorsSource).reduce(function (prev, current) {
                try {
                    prev[operatorIgnorecase ? current.toLowerCase() : current] =
                        normalizer.normalize(operatorsSource[current]);
                } catch (err) {
                    if (err instanceof ArgumentError)
                        throw new OperatorConfigurationError(current, err.argumentName, err.message);
                    throw err;
                }
                return prev;
            }, {});
        }

        // init operators
        this.operators = {};
        this.allOperatorKeys = [];
        let userOperatorTypes = {};
        userOperatorTypes[OperatorType.Comparison] = comparisonOperators;
        userOperatorTypes[OperatorType.Logical] = logicalOperators;
        userOperatorTypes[OperatorType.Unary] = unaryOperators;

        OperatorTypeKeys.forEach(function (operatorTypeKey) {
            this.operators[operatorTypeKey] =
                normalize(normalizer, userOperatorTypes[operatorTypeKey], this.operatorIgnorecase);
            this.allOperatorKeys = util.concatArray(this.allOperatorKeys,
                ...Object.keys(this.operators[operatorTypeKey]));
        }, this);

        let op;
        if (!(op = this._get_operator(defaultOperator)) || op.operatorTypeKey != OperatorType.Comparison)
            throw new OperatorNotFoundError('defaultOperator', `Comparison operator '${defaultLogicalOperator}' not found.`);
        if (!(op = this._get_operator(defaultLogicalOperator)) || op.operatorTypeKey != OperatorType.Logical)
            throw new OperatorNotFoundError('defaultLogicalOperator', `Logical operator '${defaultLogicalOperator}' not found.`);
        if (!(op = this._get_operator(arrayValueOperator)) || op.operatorTypeKey != OperatorType.Comparison)
            throw new OperatorNotFoundError('arrayValueOperator', `Comparison operator '${arrayValueOperator}' not found.`);

        this.defaultOperator = defaultOperator;
        this.defaultLogicalOperator = defaultLogicalOperator;
        this.arrayValueOperator = arrayValueOperator;

        this._reset();
    }

    /**
     * 
     * @param {Object} expr 
     * @param {Object} context 
     * @returns {Object}
     * { segment: '...', values: [] }
     */
    parse(expr, context = undefined) {
        if (util.isObject(expr) == false) throw new ArgumentError('expr', `'expr' must be of object type.`);
        this._reset();
        return this._run(this.defaultLogicalOperator, expr, undefined, undefined, 0, context);
    }

    _reset() { this.stat = {}; };

    _get_operator(key) {
        for (let i = 0; i < OperatorTypeKeys.length; i++) {
            let operatorTypeKey = OperatorTypeKeys[i];
            let operator = this.operators[operatorTypeKey][this.operatorIgnorecase ? key.toLowerCase() : key];
            if (operator) return { operatorTypeKey, operatorTypeFn: OperatorTypes[operatorTypeKey], operator };
        }
        return undefined;
    }

    _get_expr_operator_keys(expr) {
        if (util.isNullOrUndefined(expr)) return [];
        return Object.keys(expr).filter(function (key) {
            return util.inArray(this.allOperatorKeys, (this.operatorIgnorecase ? key.toLowerCase() : key));
        }, this);
    }

    _run_parse(parse, ...args) {
        let result = util._call(parse, this, ...args);
        return util.isString(result) ? { segment: result, values: [] } : result;
    }

    _validate(op, operator, prop, val, level, siblingsExpr, parentOperator) {
        if (runtimeValidatorKeys.length == 0) return true;
        let use_count = (this.stat[operator] || 0);
        let siblings = util.removeFromArray(this._get_expr_operator_keys(siblingsExpr), operator);
        let opr = { name: operator, expression: val, siblings: siblings, parent: parentOperator };
        for (let i = 0; i < runtimeValidatorKeys.length; i++) {
            let key = runtimeValidatorKeys[i];
            // schema, operator, useCount, level, prop, value   
            if (runtimeValidators[key](op[key], opr, use_count, level, prop, val) == false)
                return false;
        }
        return true;
    };


    _run(operatorKey, expr, prop, value, level, context, siblingsExpr, parentOperator) {
        let op = this._get_operator(operatorKey); if (!op) return undefined;
        let { operatorTypeFn, operator } = op;
        if (this._validate(operator, operatorKey, prop, value, level, siblingsExpr, parentOperator) == false)
            throw new IncongruentRuleError(operatorKey);
        this.stat[operatorKey] = (this.stat[operatorKey] || 0) + 1;
        let args = [operator.parse, operator.through, operatorKey, expr, prop, value, level, context];
        return util._call(operatorTypeFn, this.operatorTypeFnContext, ...args);
    }

    _dispatch(key, value, parent, level, context, siblingsExpr, parentOperator) {
        let args = [value, parent, value, level, context, siblingsExpr, parentOperator];
        return (
            // comparison
            this._run(key, ...args)
            // logical
            || this._run(key, ...args)
            // unary
            || this._run(key, ...args)

            // reset args
            || ((args = [value, key, value, level, context, siblingsExpr, parentOperator]) && false)

            // value is array
            || (util.isArray(value) &&
                this._run(this.arrayValueOperator, ...args))
            // sub
            || (util.isObject(value) &&
                this._run(this.defaultLogicalOperator, ...args))
            // default
            || this._run(this.defaultOperator, ...args));
    }
};
