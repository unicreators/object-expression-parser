//////////////////////////////
///  yichen

const util = require('./base/util'), Normalizer = require('object-normalizer');

const parse_attribute_name = 'parse', through_attribute_name = 'through';
const parse_result_normalizer = new Normalizer({
    'segment': function (value) {
        if (util.isString(value) == false)
            throw new ArgumentError('segment', `'segment' must be of String.`);
        return value;
    }, 'values': []
}, 'segment');


class Operator {
    constructor(key, attributes, engine) {
        this.key = key;
        this.attributes = attributes;
        this.engine = engine;
    }

    attr(name) { return this.attributes[name]; }

    // expr, prop, value, level, context
    _parse(...args) {
        return parse_result_normalizer.normalize(this.attr(parse_attribute_name)(...args));
    }

    // abstract
    parse() { }
}

class ComparisonOperator extends Operator {
    constructor(key, attributes, engine) {
        super(key, attributes, engine);
    }

    parse(expr, prop, value, level, context) {
        return super._parse(prop, value, this.key, level, context);
    }
}

class LogicalOperator extends Operator {
    constructor(key, attributes, engine) {
        super(key, attributes, engine);
    }

    parse(expr, prop, value, level, context) {
        if (this.attr(through_attribute_name))
            return super._parse(expr, undefined, this.key, level, context);

        let engine = this.engine; level++;
        let { segments, values } = engine.expand(expr, prop, level, context, this.key);        
        if (segments.length == 0) return { segment: '', values };

        let result = super._parse(expr, segments, this.key, level, context);
        return { segment: result.segment, values: util.concatArray(values, ...result.values) };
    }
}

class UnaryOperator extends Operator {

    constructor(key, attributes, engine) {
        super(key, attributes, engine);
    }

    parse(expr, prop, value, level, context) {
        if (this.attr(through_attribute_name))
            return super._parse(expr, undefined, this.key, level, context);

        let engine = this.engine; level++;
        let { segment, values } = engine.combine(expr, prop, level, context, this.key);
        let result = super._parse(expr, segment, this.key, level, context);
        return { segment: result.segment, values: util.concatArray(values, ...result.values) };
    }
}


module.exports = { ComparisonOperator, LogicalOperator, UnaryOperator };


