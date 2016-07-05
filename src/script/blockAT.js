import Generator from './blockGenerator';
import IEOName from './ieoName';

let path = require('path');

const BLOCK_NAME = 'AerialTriangulation';

class BlockAT {
    _rootFolder: string;

    constructor(rootFolder : string) {
        this._rootFolder = rootFolder;
    }

    static seedDEMFileName(rootFolder : string) {
        return rootFolder + '\\DEM\\SeedDEM.asc';
    }
    
    get generator() : Generator {
        let eoPath = IEOName.getLatest(this._rootFolder);
        let eoFilename = path.parse(eoPath).base;
        
        //Only calculate tie points if this is the initial run (not a bundle adjustment)
        let tieExtraction = 'On';
        if(eoFilename !== 'Initial.ieo') {
            tieExtraction = 'Off'
        }

        //TODO: Do we ever want to do an exhaustive (not standard) search?
        
        return new Generator(BLOCK_NAME, {
            TiePointExtraction: tieExtraction,
            ExtractionType: 'Standard',
            CameraCalibration: 'Unconstrained',
            EOAdjustment: 'UnconstrainedAT',
            InputEO: eoFilename,
            ATFolder: this._rootFolder + '\\AT\\',
            OutputDEM: BlockAT.seedDEMFileName(this._rootFolder)
        });
    }
    
}

export default BlockAT;