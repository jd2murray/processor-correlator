import Generator from './blockGenerator';
import BlockDSM from './blockDSM';

const BLOCK_NAME = 'DTMExtraction';

class BlockDTM {
    _rootFolder: string;

    constructor(rootFolder : string) {
        this._rootFolder = rootFolder;
    }

    static outputFileName(rootFolder : string) {
        return rootFolder + '\\DEM\\DTM.tif';    
    }
    
    get generator() : Generator {

        return new Generator(BLOCK_NAME, {
            InputDEM:     BlockDSM.outputFileName(this._rootFolder),
            OutputDEM:    BlockDTM.outputFileName(this._rootFolder)
        });
    }
}

export default BlockDTM;