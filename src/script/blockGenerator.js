
class BlockGenerator {
    
    _name: string;
    _values: Object;
    
    constructor(name : string, values : Object) {
        this._name = name;
        this._values = values;
    }

    generateBlock() : string {
        let block = '';
        block = block + '<' + this._name + '>\n' + '{\n';
        let pad = '                              ';
        let indent = '    ';
        for (let property in this._values) {
            if (this._values.hasOwnProperty(property)) {
                let key = property + pad;
                key = key.substr(0, pad.length);
                let value = this._values[property];
                block = block + indent + key + value + '\n';
            }
        }
        block = block + '}\n';
        return(block);
    }
}

export default BlockGenerator;