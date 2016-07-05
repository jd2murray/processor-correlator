import Generator from './blockGenerator';
import BlockOrthos from './blockOrthoRectification';
import IEOName from './ieoName';
let path = require('path');

const BLOCK_NAME = 'MosaicCreation';

class BlockMosaic {
    _rootFolder: string;

    constructor(rootFolder : string) {
        this._rootFolder = rootFolder;
    }

    static outputFolder(rootFolder : string) {
        return rootFolder + '\\Mosaic\\';
    }

    get generator() : Generator {
        //Get the latest ieo file to use as a base name for the oriFileList.
        let ieoFile = IEOName.getLatest(this._rootFolder);
        let ieoParts = path.parse(ieoFile);
        let oriFileName = '\\' + ieoParts.base.substr(0, ieoParts.base.length - ieoParts.ext.length) + '.orl';

        //Replace the extension.
        return new Generator(BLOCK_NAME, {
            ColorBalancing:     'On',
            Feathering:         '37',
            InputORIList:       BlockOrthos.getOrthosFolder(this._rootFolder) + oriFileName,
            MinNumBlocks:       1,
            MosaicName:         'Mosaic',
            OutputFolder:       BlockMosaic.outputFolder(this._rootFolder)
        });
    }
}

export default BlockMosaic;