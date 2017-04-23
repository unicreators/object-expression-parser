//////////////////////////////
///  yichen

const util = require('./base/util');
const { ComparisonOperator, LogicalOperator, UnaryOperator } = require('./operator');
const { normalize, runtimeValidators } = require('./attributes_normalize');
const { ArgumentError, OperatorError, OperatorAttributeError, OperatorNotFoundError, IncongruentRuleError } = require('./base/error');


const runtimeValidatorKeys = Object.keys(runtimeValidators);


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
            dispatch: this._dispatch.bind(this),
            parseExpr: function (...args) {
                return this._operate(this.defaultLogicalOperator, ...args);
            }.bind(this)
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

        this.operatorKeys = Object.keys(this.operators);

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
            key = self.operatorIgnorecase ? key.toLowerCase() : key;
            if (self.operatorKeys.indexOf(key) != -1) result.operators.push(key);
            else result.properties.push(key);
            return result;
        }, i);
    }

    _validate(operatorAttributes, operator, prop, val, level, siblingsExpr, parentOperator) {
        if (runtimeValidatorKeys.length == 0) return true;
        // args
        let use_count = (this.stat[operator] || 0);
        let siblings = this._get_expr_keys(siblingsExpr);
        siblings.operators = util.removeFromArray(siblings.operators, operator);
        let children = this._get_expr_keys(val);
        let opr = { name: operator, expr: val, parent: parentOperator, siblings, children };

        return runtimeValidatorKeys.every(function (key) {
            return runtimeValidators[key](operatorAttributes[key], opr, use_count, level, prop, val);
        });
    };


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

module.exports.ObjectExpressionParser = ObjectExpressionParser;
module.exports.ArgumentError = ArgumentError;
module.exports.OperatorError = OperatorError;
module.exports.OperatorAttributeError = OperatorAttributeError;
module.exports.OperatorNotFoundError = OperatorNotFoundError;
module.exports.IncongruentRuleError = IncongruentRuleError;
