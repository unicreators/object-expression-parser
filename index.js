//////////////////////////////
///  yichen

const _isArray = function (val) { return Array.isArray(val); },
    _isObject = function (val) { return val === Object(val) };

module.exports = class ObjectExpressionParser {
    /**
     * ExpressionParser
     * 将对象转换为语法字符串
     * 
     * @param {Object} comparisonOperators 
     * 比较操作符配置。 
     * 配置操作符及对应处理方法, 处理方法原型 (prop, value, originalOperator, context) => { segment, values }
     * {
     *     '>': function(prop, value, originalOperator, context) { return { segment: `${prop} > ?`, values: [value] }; }
     * }
     * 
     * @param {Object} logicalOperators 
     * 逻辑操作符配置。  
     * 配置操作符及对应处理方法, 处理方法原型 (segments, originalOperator, level, context) => String
     * {
     *     'and': function(segments, originalOperator, level, context) { return segments.join(' AND '); }
     * }
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
    constructor(comparisonOperators, logicalOperators, defaultOperator,
        defaultLogicalOperator, arrayValueOperator, operatorIgnorecase = true) {
        
        if (_isObject(comparisonOperators) == false)
            throw new Error(`argument error.('comparisonOperators')`);
        if (_isObject(logicalOperators) == false)
            throw new Error(`argument error.('logicalOperators')`);
        this.operatorIgnorecase = !!operatorIgnorecase;
        this.logicalOperators = this.operatorIgnorecase ?  this._toLowerCaseKey(logicalOperators): logicalOperators;
        this.comparisonOperators = this.operatorIgnorecase ?  this._toLowerCaseKey(comparisonOperators): comparisonOperators;

        if (!this._c(defaultOperator))
            throw new Error(`defaultOperator('${defaultOperator}') not found.`);
        if (!this._l(defaultLogicalOperator))
            throw new Error(`defaultLogicalOperator('${defaultLogicalOperator}') not found.`);
        if (!this._c(arrayValueOperator))
            throw new Error(`arrayValueOperator('${arrayValueOperator}') not found.`);

        this.defaultOperator = defaultOperator;
        this.defaultLogicalOperator = defaultLogicalOperator;
        this.arrayValueOperator = arrayValueOperator;        

    }

    /**
     * 
     * @param {Object} expr 
     * @param {Object} context 
     * @returns {Object}
     * { segment: '...', values: [] }
     */
    parse(expr, context = undefined) {
        if (_isObject(expr) == false) throw new Error(`'expr' must be of object type.`);
        return this._(expr, undefined, undefined, context, 0);
    }

    _toLowerCaseKey(source) {
        return Object.keys(source).reduce(function (prev, current) {
            prev[current.toLowerCase()] = source[current]; return prev;
        }, {});
    }
    _l(key) { return this.logicalOperators[this.operatorIgnorecase ? key.toLowerCase() : key]; }
    _c(key) { return this.comparisonOperators[this.operatorIgnorecase ? key.toLowerCase() : key]; }

    _expr(key, value, parent, context, level) {        
        // logical operator   
        if (this._l(key)) return this._(value, key, parent, context, level);
        // comparison operator
        let _op = this._c(key);
        if (_op) return _op(parent, value, key, context);
        // array     
        if (_isArray(value)) return this._c(this.arrayValueOperator)(key, value, this.arrayValueOperator, context);
        // sub
        if (_isObject(value)) return this._(value, undefined, key, context, level);
        // :
        return this._c(this.defaultOperator)(key, value, this.defaultOperator, context);
    }

    _(expr, operator, parent, context, level) {
        let self = this, _op = operator && this._l(operator);
        if (!_op) return this._(expr, this.defaultLogicalOperator, parent, context, level);
        level++;
        let { segments, values } = Object.keys(expr).reduce(function (prev, key) {
            let e = self._expr(key, expr[key], parent, context, level);
            prev.segments.push(e.segment);
            prev.values = Array.prototype.concat(prev.values, e.values);
            return prev;
        }, { segments: [], values: [] });

        if (segments.length == 0) return { segment: '', values };
        return { segment: _op(segments, operator, level, context), values };
    }
};
