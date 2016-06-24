import Generator from './blockGenerator';
let path = require('path');

//<AerialTriangulation>
//    {
//        TiePointExtraction On
//	ExtractionType	   Standard
//	CameraCalibration  Unconstrained
//	EOAdjustment       UnconstrainedAT
//	InputEO            E:\Correlator3dWork\DataSetBenjamin642\Correlator3D\IEO\Initial\Initial.ieo
//	ATFolder           E:\Correlator3dWork\DataSetBenjamin642\Correlator3D\AT\
//	OutputDEM		   E:\Correlator3dWork\DataSetBenjamin642\Correlator3D\DEM\SeedDEM.asc
//}

const BLOCK_NAME = 'AerialTriangulation';



class BlockAT {
    _rootFolder: string;

    constructor(rootFolder : string) {
        this._rootFolder = rootFolder;
    }
    
    findLatestIEO() : string {
        //TODO: scan the directory for initial, Step_1, Step_2, etc. to find the latest and use it.
        return this._rootFolder + '\\IEO\\Initial\\Initial.ieo';
    }
    
    get generator() : Generator {
        let eoPath = this.findLatestIEO(); 
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
            OutputDEM: this._rootFolder + '\\DEM\\SeedDEM.asc'
        });
    }
    
}

export default BlockAT;