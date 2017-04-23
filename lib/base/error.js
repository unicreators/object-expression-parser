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

class OperatorAttributeError extends OperatorError {
    constructor(operatorName, attributeName, message = undefined) {
        super(operatorName, message);
        this.attributeName = attributeName;
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
    OperatorAttributeError,
    OperatorNotFoundError,
    IncongruentRuleError
};