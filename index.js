//////////////////////////////
///  yichen

const {
    ArgumentError,
    OperatorError,
    OperatorConfigurationError,
    OperatorNotFoundError,
    IncongruentRuleError
} = require('./lib/error'),
    ExpressionParser = require('./lib/index');

module.exports = ExpressionParser;

module.exports.ExpressionParser = ExpressionParser;
module.exports.ArgumentError = ArgumentError;
module.exports.OperatorError = OperatorError;
module.exports.OperatorConfigurationError = OperatorConfigurationError;
module.exports.OperatorNotFoundError = OperatorNotFoundError;
module.exports.IncongruentRuleError = IncongruentRuleError;