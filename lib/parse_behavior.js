//////////////////////////////
///  yichen

const ParseBehavior = {
    Default: 1,
    OperatorOnly: 2,
    PropertyOnly: 4,
    OperatorFirst: 8,
    PropertyFirst: 16
};

const ParseBehaviorArray = [
    ParseBehavior.Default,
    ParseBehavior.OperatorOnly,
    ParseBehavior.PropertyOnly,
    ParseBehavior.OperatorFirst,
    ParseBehavior.PropertyFirst];

module.exports = { ParseBehavior, ParseBehaviorArray };