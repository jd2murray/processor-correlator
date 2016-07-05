import Generator from './blockGenerator';
import IEOName from './ieoName';
import BlockAT from './blockAT';

let path = require('path');

const BLOCK_NAME = 'DSMGeneration';

class BlockDSM {
    _rootFolder: string;

    constructor(rootFolder : string) {
        this._rootFolder = rootFolder;
    }

    static outputFileName(rootFolder : string) : string {
        return rootFolder + '\\DEM\\DSM.tif';
    }
    get generator() : Generator {
        let eoPath = IEOName.getLatest(this._rootFolder);
        
        return new Generator(BLOCK_NAME, {
            AboveGroundVar:     'Automatic', 
            BelowGroundVar:     'Automatic', 
            GeneratePointCloud: 'On', 
            InputDEM:           BlockAT.seedDEMFileName(this._rootFolder), 
            InputEO:            eoPath, 
            OutputDEM:          BlockDSM.outputFileName(this._rootFolder),
            Resolution:         'Optimal',
            VertAccuracy:       'Optimal'
        });
    }
}

export default BlockDSM;