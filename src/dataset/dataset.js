import ieoGen from '../initialIEO/ieoGen';
import Image from '../initialIEO/image';
import Projection from '../initialIEO/wgs84Projection';
import Camera from '../initialIEO/camera';
import Script from '../script/script';
import FileUtils from '../fileUtils';
import BlockAT from '../script/blockAT';
import BlockDSM from '../script/blockDSM';
import BlockDTM from '../script/blockDTM';
import BlockOrthos from '../script/blockOrthoRectification';
import BlockMosaic from '../script/blockMosaic';
import type {DatasetStateType, ProcessingStateType} from './state';
import {ProcessingState} from './state';

let fse = require('fs-extra');
let xWriter = require('xml-writer');
let path = require('path');

const _logger = require ( 'log4js' ).getLogger ( path.basename ( __filename ) );


class Dataset {
    _inputDir : string;
    _camera : Camera;
    _workingDir : string;
    _state : DatasetStateType;
    
    constructor (inputDir : string, workingDir: string, camera: Camera) {
        this._camera = camera;
        this._inputDir = inputDir;
        this._workingDir = workingDir;
        this._state = {
            processingState : ProcessingState.IDLE,
            demAvailable : false
        };
    }
    
    get state() : DatasetStateType {
        return this._state;
    }
    
    download() {

    }
    
    initialize() : void {
        let dirFiles;
        try {
            dirFiles = fse.readdirSync(this._inputDir);
        } catch (err) {
            _logger.error('Error reading directory: ' + this._inputDir + '. err: ' + err);
            this._state.processingState = ProcessingState.ERROR;
            return;
        }

        let images : Array<image> = [];
        dirFiles.forEach((name) => {
            let jpgMatches = name.match(/.+\.(jpg|JPG)$/);
            if(jpgMatches) {
                let fullFileName = path.join(this._inputDir, name);
                let img = new Image(fullFileName);
                try {
                    img.readData();
                } catch(err) {
                    console.log(err);
                    process.exit(-1);
                }
                images.push(img);
            }
        });

        //Get the projection from the first image - assume all of the images are in the same zone.
        let projection = new Projection();
        projection.calculateProjection(images[0].lat, images[0].long);

        let ieo = new ieoGen({
            camera : this._camera,
            imageFolder: this._inputDir,
            images: images,
            projection: projection
        });
        let xw = new xWriter();
        xw.startDocument();
        ieo.generate(xw);
        xw.endDocument();

        let success = true;
        let errExit = (err : string) => {
            _logger.error("Error: " + err);
            success = false;
            this._state.processingState = ProcessingState.ERROR;

        };

        //Ensure the directory for IEO exists...
        if(success) FileUtils.ensureExistsDir(this._workingDir, errExit);
        if(success) FileUtils.ensureExistsDir(this._workingDir + '\\IEO', errExit);
        if(success) FileUtils.ensureExistsDir(this._workingDir + '\\IEO' + '\\Initial', errExit);

        if(success) {
            //Generate the IEO
            let ieoName = this._workingDir + '\\IEO\\Initial\\Initial.ieo';
            FileUtils.ensureNotExistsFile(ieoName);
            fse.appendFileSync(ieoName, xw.toString());
        }
    }
    
    triangulate() {
        //Assemble and write the AT script.
        let scriptName = this._workingDir + '\\ATScript.spt';
        FileUtils.ensureNotExistsFile(scriptName);
        let script = new Script();

        let at = new BlockAT(this._workingDir);
        script.addBlockGenerator(at.generator);

        fse.appendFileSync(scriptName, script.generateScript());
    }

    generateDSMDTM() {
        let scriptName = this._workingDir + '\\DSMDTMScript.spt';
        FileUtils.ensureNotExistsFile(scriptName);
        let script = new Script();

        let dsm = new BlockDSM(this._workingDir);
        script.addBlockGenerator(dsm.generator);
        let dtm = new BlockDTM(this._workingDir);
        script.addBlockGenerator(dtm.generator);

        fse.appendFileSync(scriptName, script.generateScript());
    }
    
    generateMosaic() {
        let scriptName = this._workingDir + '\\MosaicScript.spt';
        FileUtils.ensureNotExistsFile(scriptName);
        let script = new Script();
        
        let orthos = new BlockOrthos(this._workingDir);
        script.addBlockGenerator(orthos.generator);
        let mosaic = new BlockMosaic(this._workingDir);
        script.addBlockGenerator(mosaic.generator);

        fse.appendFileSync(scriptName, script.generateScript());
    }
    
}

export default Dataset;

