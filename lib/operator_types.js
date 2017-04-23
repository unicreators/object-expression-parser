//////////////////////////////
///  yichen

const util = require('./base/util');

const OperatorType = { Comparison: 'Comparison', Logical: 'Logical', Unary: 'Unary' };

const OperatorTypeHandlers = {
    Comparison: function (parse, through, operator, expr, prop, value, level, context) {
        return this.callParse(parse, prop, value, operator, context);
    },
    Logical: function (parse, through, operator, expr, prop, value, level, context) {
        if (through) return this.callParse(parse, expr, undefined, operator, level, context);
        let self = this; level++;
        let { segments, values } = Object.keys(expr).reduce(function (prev, key) {
            let { segment, values } = self.dispatch(key, expr[key], prop, level, context, expr, operator);
            return { segments: util.concatArray(prev.segments, segment), values: util.concatArray(prev.values, ...values) };
        }, { segments: [], values: [] });
        if (segments.length == 0) return { segment: '', values };
        let _result = this.callParse(parse, expr, segments, operator, level, context);
        return { segment: _result.segment, values: util.concatArray(values, ..._result.values) };
    },
    Unary: function (parse, through, operator, expr, prop, value, level, context) {
        if (through) return this.callParse(parse, expr, undefined, operator, level, context);
        let { segment, values } = this.parse(expr, prop, value, level, context);
        let _result = this.callParse(parse, expr, segment, operator, level, context);
        return { segment: _result.segment, values: util.concatArray(values, ..._result.values) };
    }
};

module.exports = { OperatorType, OperatorTypeHandlers };