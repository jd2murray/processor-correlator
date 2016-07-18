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

let ChildProcess = require('child_process').spawn;
let fse = require('fs-extra');
let xWriter = require('xml-writer');
let path = require('path');

const _logger = require ( 'log4js' ).getLogger ( path.basename ( __filename ) );


class Dataset {
    _inputDir : string;
    _C3DPath : string;
    _camera : Camera;
    _workingDir : string;
    _state : DatasetStateType;
    _worker : ?ChildProcess;
    
    constructor (inputDir : string, workingDir: string, C3DPath: string, camera: Camera) {
        this._camera = camera;
        this._inputDir = inputDir;
        this._workingDir = workingDir;
        this._C3DPath = C3DPath;
        this._worker = null;
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
        let errExit = (err : Error) => {
            _logger.error("Error: " + err.message);
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

    _scriptError(error : Error) {
        //Interesting that this is called when running under service and not when running cli...perhaps C3D detects
        //whether or not there is a window attached to process or not and decides to thwor errors/etc. only if there is.
        //This could be good for us - no need to detect popups/etc. as correlator may be well behaved.
        this._state.processingState = ProcessingState.ERROR;
    }

    _scriptSOutData(data : ?string) {
        _logger.info(data);
    }

    _scriptSErrData(data : ?string) {
        _logger.warn(data);

    }

    _scriptDone(code : number) {
        _logger.info(code);
        //this._state.processingState = ProcessingState.IDLE;
    }

    _launchScript(scriptName: string) {
        //TODO: We need to detect script crashes and 'popup' messages and kill /end the process cleanly...
        //TODO: ChildProcess does have a method '.kill' which can be used to end the process, but when to invoke it?

        //Run correlator with:
        //   - verbose mode (/v)
        //   - showing percentage progress (/p)
        //   - Sending log information to scriptLog.txt (/r)
        //   - with our script as control (/f)
        this._worker = new ChildProcess(
            this._C3DPath,
            ['/v', '/p', '/r', this._workingDir + '\\scriptLog.txt', '/f', scriptName],
            {
                cwd: this._workingDir
            });
        this._worker.stdout.on('data', this._scriptSOutData.bind(this));
        this._worker.stderr.on('data', this._scriptSErrData.bind(this));
        this._worker.on('close', this._scriptDone.bind(this));
        this._worker.on('error', this._scriptError.bind(this));
    }
    
    triangulate() {
        //Assemble and write the AT script.
        let scriptName = this._workingDir + '\\ATScript.spt';
        FileUtils.ensureNotExistsFile(scriptName);
        let script = new Script();

        let at = new BlockAT(this._workingDir);
        script.addBlockGenerator(at.generator);

        fse.appendFileSync(scriptName, script.generateScript());
        
        this._state.processingState = ProcessingState.TRIANGULATING;
        this._launchScript(scriptName);
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
        this._state.processingState = ProcessingState.GENERATING_DEM;
        this._launchScript(scriptName);
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
        this._state.processingState = ProcessingState.GENERATING_MOSAIC;
        this._launchScript(scriptName);
    }
}

export default Dataset;

