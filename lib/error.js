//////////////////////////////
///  yichen


class ArgumentError extends Error {
    constructor(argumentName, message = undefined) {
        super(message);
        this.argumentName = argumentName;
    }
}

class OperatorError extends Error {
    constructor(operatorName, message = undefined) {
        super(message);
        this.operatorName = operatorName;
    }
}

class OperatorConfigurationError extends OperatorError {
    constructor(operatorName, propertyName, message = undefined) {
        super(operatorName, message);
        this.propertyName = propertyName;
    }
}

class OperatorNotFoundError extends Error {
    constructor(operatorName, message = undefined) {
        super(message);
        this.operatorName = operatorName;
    }
}


class ObjectExpressionError extends Error {
    constructor(message = undefined) {
        super(message);
    }
}


class IncongruentRuleError extends OperatorError {
    constructor(operatorName, message = undefined) {
        super(operatorName, message);
    }
}

module.exports = {
    ArgumentError,
    OperatorError,
    OperatorConfigurationError,
    OperatorNotFoundError,
    IncongruentRuleError
};