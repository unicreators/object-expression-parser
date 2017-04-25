//////////////////////////////
///  yichen

const util = require('./base/util');
const { ComparisonOperator, LogicalOperator, UnaryOperator } = require('./operator');
const { normalize, runtimeValidators } = require('./attributes_normalize');
const { ArgumentError, OperatorError, OperatorAttributeError, OperatorNotFoundError, IncongruentRuleError } = require('./base/error');
const { ParseBehavior } = require('./parse_behavior');
const runtimeValidatorKeys = Object.keys(runtimeValidators);
const attribute_parse_behavior_name = 'parseBehavior', attribute_priority_name = 'priority';


const ObjectExpressionParser = class ObjectExpressionParser {

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

        // bind context
        let engine = {
            // expr, prop, value, level, context
            expand: this._expand.bind(this),
            combine: this._combine.bind(this)
        };


        this.operators = {};
        comparisonOperators = normalize(comparisonOperators, this.operatorIgnorecase);
        this.operators = Object.keys(comparisonOperators).reduce(function (operators, operatorKey) {
            let attributes = comparisonOperators[operatorKey];
            operators[operatorKey] = new ComparisonOperator(operatorKey, attributes, engine);
            return operators;
        }, this.operators);

        logicalOperators = normalize(logicalOperators, this.operatorIgnorecase);
        this.operators = Object.keys(logicalOperators).reduce(function (operators, operatorKey) {
            let attributes = logicalOperators[operatorKey];
            operators[operatorKey] = new LogicalOperator(operatorKey, attributes, engine);
            return operators;
        }, this.operators);

        unaryOperators = normalize(unaryOperators, this.operatorIgnorecase);
        this.operators = Object.keys(unaryOperators).reduce(function (operators, operatorKey) {
            let attributes = unaryOperators[operatorKey];
            operators[operatorKey] = new UnaryOperator(operatorKey, attributes, engine);
            return operators;
        }, this.operators);


        let operator;
        if (!(operator = this._find_operator(defaultOperator)) || (operator instanceof ComparisonOperator) == false)
            throw new OperatorNotFoundError('defaultOperator', `Comparison operator '${defaultLogicalOperator}' not found.`);
        if (!(operator = this._find_operator(defaultLogicalOperator)) || (operator instanceof LogicalOperator) == false)
            throw new OperatorNotFoundError('defaultLogicalOperator', `Logical operator '${defaultLogicalOperator}' not found.`);
        if (!(operator = this._find_operator(arrayValueOperator)) || (operator instanceof ComparisonOperator) == false)
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
        return this._operate(this.defaultLogicalOperator, expr, undefined, undefined, 0, context);
    }

    _reset() { this.stat = {}; };

    _find_operator(key) { return this.operators[this.operatorIgnorecase ? key.toLowerCase() : key]; }

    _get_expr_keys(expr) {
        let i = { operators: [], properties: [] };
        if (util.isNullOrUndefined(expr)) return i;
        let self = this;
        return Object.keys(expr).reduce(function (result, key) {
            let operator = self._find_operator(key);
            if (operator) result.operators.push(operator);
            else result.properties.push(key);
            return result;
        }, i);
    }

    _get_expr_parse_behavior_keys(expr, parseBehavior) {
        if (parseBehavior == ParseBehavior.Default) return Object.keys(expr);
        let { operators, properties } = this._get_expr_keys(expr);
        // priority
        operators = operators.sort(function (a, b) {
            return b.attr(attribute_priority_name) - a.attr(attribute_priority_name);
        }).map(function (op) { return op.key; });
        switch (parseBehavior) {
            case ParseBehavior.OperatorOnly: return operators;
            case ParseBehavior.PropertyOnly: return properties;
            case ParseBehavior.OperatorFirst: return util.concatArray(operators, ...properties);
            case ParseBehavior.PropertyFirst: return util.concatArray(properties, ...operators);
            default: return [];
        }
    }

    _validate(operatorAttributes, operator, prop, val, level, siblingsExpr, parentOperator) {
        if (runtimeValidatorKeys.length == 0) return true;
        // args
        let use_count = (this.stat[operator] || 0);
        let siblings = this._get_expr_keys(siblingsExpr);
        siblings.operators = util.removeFromArray(siblings.operators.map(function (op) { return op.key; }), operator);
        let children = this._get_expr_keys(val);
        children.operators = children.operators.map(function (op) { return op.key; });
        let opr = { name: operator, expr: val, parent: parentOperator, siblings, children };

        return runtimeValidatorKeys.every(function (key) {
            return runtimeValidators[key](operatorAttributes[key], opr, use_count, level, prop, val);
        });
    };

    _expand(expr, prop, level, context, siblingsExpr, parentOperator) {
        let self = this, parseBehavior = parentOperator ?
            parentOperator.attr(attribute_parse_behavior_name) : ParseBehavior.Default;
        return this._get_expr_parse_behavior_keys(expr, parseBehavior).reduce(function (prev, key) {
            let { segment, values } = self._dispatch(key, expr[key], prop,
                level, context, expr, parentOperator ? parentOperator.key : undefined);
            return { segments: util.concatArray(prev.segments, segment), values: util.concatArray(prev.values, ...values) };
        }, { segments: [], values: [] });
    }

    _combine(expr, prop, level, context, siblingsExpr, parentOperator) {
        return this._operate(this.defaultLogicalOperator,
            expr, prop, expr, level, context, siblingsExpr,
            parentOperator ? parentOperator.key : undefined);
    }


    _operate(operatorKey, expr, prop, value, level, context, siblingsExpr, parentOperator) {
        let operator = this._find_operator(operatorKey); if (!operator) return undefined;
        if (this._validate(operator.attributes, operatorKey, prop, value, level, siblingsExpr, parentOperator) == false)
            throw new IncongruentRuleError(operatorKey);
        this.stat[operatorKey] = (this.stat[operatorKey] || 0) + 1;
        return operator.parse(expr, prop, value, level, context);
    }

    _dispatch(key, value, parent, level, context, siblingsExpr, parentOperator) {
        let args = [value, parent, value, level, context, siblingsExpr, parentOperator];
        return (
            this._operate(key, ...args)
            // reset args
            || ((args = [value, key, value, level, context, siblingsExpr, parentOperator]) && false)
            // value is array
            || (util.isArray(value) &&
                this._operate(this.arrayValueOperator, ...args))
            // sub
            || (util.isObject(value) &&
                this._operate(this.defaultLogicalOperator, ...args))
            // default
            || this._operate(this.defaultOperator, ...args));
    }
};

module.exports = ObjectExpressionParser;

module.exports.ParseBehavior = ParseBehavior;
module.exports.ObjectExpressionParser = ObjectExpressionParser;
module.exports.ArgumentError = ArgumentError;
module.exports.OperatorError = OperatorError;
module.exports.OperatorAttributeError = OperatorAttributeError;
module.exports.OperatorNotFoundError = OperatorNotFoundError;
module.exports.IncongruentRuleError = IncongruentRuleError;
