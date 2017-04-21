//////////////////////////////
///  yichen

const util = require('./util');

module.exports = class Normalizer {
    constructor(schema, defaultProperty) {
        this.schemaKeys = Object.keys(schema);
        this.schema = schema;
        this.defaultOperator = defaultProperty;
    }
    normalize(item) {
        if (util.isObject(item) == false) {
            let i = {}; i[this.defaultOperator] = item;
            item = i;
        }
        let schema = this.schema;
        return this.schemaKeys.reduce(function (prev, current) {
            prev[current] = schema[current](item[current]);
            return prev;
        }, {});
    }
};