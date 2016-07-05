import Generator from './blockGenerator';
import IEOName from './ieoName';
import BlockDTM from './blockDTM';

const BLOCK_NAME = 'Orthorectification';

class BlockOrthoRectification {
    _rootFolder: string;

    constructor(rootFolder : string) {
        this._rootFolder = rootFolder;
    }

    static getOrthosFolder(rootFolder : string) {
        return rootFolder + '\\Orthos';
    }
    
    get generator() : Generator {

        return new Generator(BLOCK_NAME, {
            DSMBased:       'Off',
            InputDEM:       BlockDTM.outputFileName(this._rootFolder),
            InputEO:        IEOName.getLatest(this._rootFolder),
            OutputFormat:   'GeoTIFF',
            OutputORIFolder: BlockOrthoRectification.getOrthosFolder(this._rootFolder),
            Overlap:        'Optimal',
            Overviews:      'On',
            Resolution:     'Optimal',
            TiledTiff:      'Tiled'
        });
    }
}

export default BlockOrthoRectification;