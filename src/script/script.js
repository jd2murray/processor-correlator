import BlockGenerator from './blockGenerator';

class Script {
    _generators: Array<BlockGenerator>;
    
    constructor() {
        this._generators = [];
    }
    
    addBlockGenerator(generator : BlockGenerator) : void {
        this._generators.push(generator);
    }
    
    generateScript() : string {
        let script = '';
        this._generators.forEach((generator) => {
            script = script + generator.generateBlock();
        });
        
        return script;
    }
}

export default Script;
