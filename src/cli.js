import Dataset from './dataset/dataset';
import Camera from './initialIEO/camera';
import {DatasetStateType, ProcessingStateType} from './dataset/state';

var program = require('commander');
let fse = require('fs-extra');
let pkg = JSON.parse(fse.readFileSync('package.json', 'utf8'));

let path = require('path');

let errExit = (err) => {
    console.log('Error: ' + err.message);
    process.exit(-1);
};

program
    .version(pkg.version)
    .option('-d, --directory <directory>', 'Directory which contains the images')
    .option('-o, --output <output>', 'Output directory')
    .option('-c, --C3DPath <C3DPath>')
    .parse(process.argv);

let outputPath = '';
try {
    outputPath = path.resolve(program.output);
    console.log (outputPath);
} catch (err) {
    errExit(new Error('Error in output path specification: ' + err.message));
}

if(!program.output ||
    outputPath === '') {
    errExit('Error - invalid invocation. Please check parameters.');
}

if(!program.C3DPath ||
    program.C3DPath === '') {
    errExit('Error - invalid invocation. Please check parameters.');
}

let dataset = new Dataset(program.directory, program.output, program.C3DPath, new Camera({
    name: 'CLICamera',
    imageWidth: 1920,
    imageHeight: 1080,
    focalLength: 2.2,
    pixelSize: 2.4
}));

dataset.initialize();
let success = dataset.state.processingState != ProcessingStateType.ERROR;

if(success) {
    dataset.triangulate();
    //dataset.generateDSMDTM();
    //dataset.generateMosaic();
}

console.log('Finished!');