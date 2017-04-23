//////////////////////////////
///  yichen

const util = require('./base/util'),
    attributes = require('./operator_attributes'),
    Normalizer = require('object-normalizer'),
    { OperatorAttributeError } = require('./base/error');


const defaultNormalizeProperty = 'parse';


const normalizer = new Normalizer(Object.keys(attributes)
    .reduce(function (result, name) {        
        result[name] = attributes[name].normalize;
        return result;
    }, {}), defaultNormalizeProperty);


const normalize = function (operatorsSource, operatorKeyIgnorecase) {
    return Object.keys(operatorsSource).reduce(function (prev, current) {
        try {
            prev[operatorKeyIgnorecase ? current.toLowerCase() : current] =
                normalizer.normalize(operatorsSource[current]);
        } catch (err) {
            if (err instanceof ArgumentError)
                throw new OperatorAttributeError(current, err.argumentName, err.message);
            throw err;
        }
        return prev;
    }, {});
};


// 运行时值验证器
const runtimeValidators = Object.keys(attributes)
    .reduce(function (result, name) {
        let attribute = attributes[name];        
        if (util.isFunction(attribute.validate))
            result[name] = attribute.validate;
        return result;
    }, {});

module.exports = { normalize, runtimeValidators };

