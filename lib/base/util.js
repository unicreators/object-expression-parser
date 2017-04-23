//////////////////////////////
///  yichen

class Util {    
    isObject(val) { return typeof val === 'object'; };
    isNullOrUndefined(val) { return val == null || val == undefined; };
    isFunction(val) { return typeof val === 'function'; };
    isString(val) { return typeof val === 'string'; };
    isArray(val) { return Array.isArray(val); };
    isBoolean(val) { return typeof val === 'boolean'; };
    toBoolean(val, def) {
        if (this.isNullOrUndefined(val)) return def;
        if (this.isBoolean(val)) return val;
        var str = String(val).trim().toLowerCase();
        return str.length == 0 ? def : !!JSON.parse(str);
    };
    toInt(val, min, max, def) {
        var real = parseInt(val);
        return isNaN(real) ||
            (this.isNullOrUndefined(min) == false && real < min) ||
            (this.isNullOrUndefined(min) == false && real > max) ?
            def : real;
    };
    inArray(val, ...array) {
        if (this.isNullOrUndefined(val)) return false;
        return array.every(function (v) {
            return val.indexOf(v) != -1;
        });
    };
    toArray(val,
        removeEmptyItem = true,
        convertItemFn = undefined,
        def = undefined) {
        removeEmptyItem = removeEmptyItem || true;
        if (this.isNullOrUndefined(val)) return def;
        // single to array
        if (this.isArray(val) == false) val = [val];
        let self = this;
        if (removeEmptyItem)
            val = val.filter(function (item) { return self.isNullOrUndefined(item) == false; });
        if (this.isFunction(convertItemFn))
            val = val.map(function (item) { return convertItemFn(item); });
        return val;
    };
    concatArray(arr1, ...arr2) { return Array.prototype.concat(arr1, arr2) };
    removeFromArray(array, ...items) {
        items.forEach(function (item) {
            let index = array.indexOf(item);
            if (index > -1) array.splice(index, 1);
        });
        return array;
    };
}

module.exports = new Util();