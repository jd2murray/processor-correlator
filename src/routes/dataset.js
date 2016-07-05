import Express from 'express';
import DatasetProcessor from '../dataset/dataset';
import type {DatasetStateType} from '../dataset/state';
import {ProcessingState} from '../dataset/state';

const _logger = require ( 'log4js' ).getLogger ( path.basename ( __filename ) );

let REST_NOT_ALLOWED = 405; //We'll use this when an invalid op was requested due to current state.

class Dataset {
    _workingDir : string;
    _dsProcessor : ?DatasetProcessor;
    
    constructor (app : Express, workingDir : string) {
        this._workingDir = workingDir;
        this._dsProcessor = null;
        
        app.all('/dataset/open', this.open);
        app.all('/dataset/reset', this.reset);
        app.all('/dataset/triangulate', this.triangulate);
        app.all('/dataset/genDem', this.generateDEM);
        app.all('/dataset/genMosaic', this.generateMosaic);
    }
    
    open(req, res) : void {
        _logger.info('Opening dataset');

        //Just return an error if we already have a dataset.
        if(this._dsProcessor) {
            _logger.error('Attempt to open a dataset when one is already open!');
            res
                .json({
                    processingState : ProcessingState.ERROR
                })
                .statusCode(REST_NOT_ALLOWED);
            return;
        }
        
        //Get the bucket name from the parameters.
        //Download 
        
        //Initialize the dsProcessor.
        this._dsProcessor = new DatasetProcessor(
            //this._workingDir + '\\InputData', 
            'e:\\Correlator3dWork\\Datasets\\Benjamin_EXIF_KAPPA\\',
            this._workingDir + '\\Correlator\\',
            new Camera({
                name: 'FixedCamera', 
                imageWidth: 1920, 
                imageHeight: 1080, 
                focalLength: 2.2, 
                pixelSize: 2.4
            }));
        
        this._dsProcessor.initialize();
        res.json({
            status: this._dsProcessor.state
        });
    }

    reset(req, res) : void {
        //Delete the data on filesystem.
        //Kill the processor.
        
    }
    
    triangulate(req, res) : void {
        _logger.info('Initiating triangulation');
        if(!this._dsProcessor || this._dsProcessor.state.processingState != ProcessingState.IDLE) {
            _logger.error('Cannot initiate triangulation b/c either no dataset or datasetProcessor not idle.!');
           let res = {};
            if(!this._dsProcessor) {
                res = {processingState : ProcessingStateType.ERROR}
            } else {
                res = this._dsProcessor.state;
            }
            res.json(res)
                .statusCode(REST_NOT_ALLOWED);
            return;
        }

        //Initiate triangulation and return the state.
        this._dsProcessor.triangulate();
        res.json(this._dsProcessor.state);
    }
    
    generateDEM(req, res) : void {
        _logger.info('Initiating DSMDTM');
        if(!this._dsProcessor || this._dsProcessor.state.processingState != ProcessingState.IDLE) {
            _logger.error('Cannot initiate DEM b/c either no dataset or datasetProcessor not idle.!');
            let res = {};
            if(!this._dsProcessor) {
                res = {processingState : ProcessingStateType.ERROR}
            } else {
                res = this._dsProcessor.state;
            }
            res.json(res)
                .statusCode(REST_NOT_ALLOWED);
            return;
        }

        //Initiate DEM generation and return the state.
        this._dsProcessor.generateDSMDTM();
        res.json(this._dsProcessor.state);

        //TODO: Upload results (DTM/DSM) to specified bucket.
    }
    
    //Will generate the mosaic using initial triangulation if DSM/DTM have not been generated.
    ////OTHERWISE, uses the results of DSM/DTM
    generateMosaic(req, res) : void {
        _logger.info('Initiating Mosaic/LAS generation');
        if(!this._dsProcessor || this._dsProcessor.state.processingState != ProcessingState.IDLE) {
            _logger.error('Cannot initiate DEM b/c either no dataset or datasetProcessor not idle.!');
            let res = {};
            if(!this._dsProcessor) {
                res = {processingState : ProcessingStateType.ERROR}
            } else {
                res = this._dsProcessor.state;
            }
            res.json(res)
                .statusCode(REST_NOT_ALLOWED);
            return;
        }

        //TODO: check to see if DEM available before assuming it is.  If not, use the initial DEM.
        //Initiate Mosaic generation and return the state.
        this._dsProcessor.generateMosaic();
        res.json(this._dsProcessor.state);

        //TODO: Upload results (orthomosaic and .las) to specified bucket.
    }
}

export default Dataset;
