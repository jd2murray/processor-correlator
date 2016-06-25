var program = require('commander');
let fse = require('fs-extra');
let pkg = JSON.parse(fse.readFileSync('package.json', 'utf8'));
let xWriter = require('xml-writer');
import ieoGen from './initialIEO/ieoGen';
import Image from './initialIEO/image';
import Projection from './initialIEO/wgs84Projection';
import Camera from './initialIEO/camera';
import ScriptGenerator from './scriptGen/scriptGenerator';
import FileUtils from './fileUtils';
import BlockAT from './scriptGen/blockAT';
import BlockDSM from './scriptGen/blockDSM';
import BlockDTM from './scriptGen/blockDTM';
import BlockOrthos from './scriptGen/blockOrthoRectification';
import BlockMosaic from './scriptGen/blockMosaic';

let path = require('path');

let errExit = (err) => {
    console.log('Error: ' + err.message);
    process.exit(-1);
};

program
    .version(pkg.version)
    .option('-d, --directory <directory>', 'Directory which contains the images')
    .option('-o, --output <output>', 'Output directory')
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
    console.log('Error - invalid invocation. Please check parameters.');
    process.exit(-1);
}

let dirFiles;
try {
    dirFiles = fse.readdirSync(program.directory);
} catch (err) {
    console.log('Error reading directory: ' + program.directory + '. err: ' + err);
    process.exit(-1);
}

let images : Array<image> = [];
dirFiles.forEach((name) => {
    let jpgMatches = name.match(/.+\.(jpg|JPG)$/);
    if(jpgMatches) {
        let fullFileName = path.join(program.directory, name);
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
let proj = new Projection();
proj.calculateProjection(images[0].lat, images[0].long);

let ieo = new ieoGen({
    camera: new Camera({
        name: 'Test Camera',
        imageWidth: 1920,
        imageHeight: 1080,
        focalLength: 2.8,
        pixelSize: 2.2
    }),
    imageFolder: program.directory,
    images: images,
    projection: proj
});

let xw = new xWriter();
xw.startDocument();
ieo.generate(xw);
xw.endDocument();


//Ensure the directory for IEO exists...
FileUtils.ensureExistsDir(outputPath, errExit);
FileUtils.ensureExistsDir(outputPath + '\\IEO', errExit);
FileUtils.ensureExistsDir(outputPath + '\\IEO' + '\\Initial', errExit);

//Generate the IEO
let ieoName = outputPath + '\\IEO\\Initial\\Initial.ieo';
FileUtils.ensureNotExistsFile(ieoName);
fse.appendFileSync(ieoName, xw.toString());

//Assemble and write the AT script.
let scriptName = outputPath + '\\ATScript.spt';
FileUtils.ensureNotExistsFile(scriptName);
let scriptGen = new ScriptGenerator();

let AT = new BlockAT(outputPath);
scriptGen.addBlockGenerator(AT.generator);

fse.appendFileSync(scriptName, scriptGen.generateScript());


//Assemble and write the finish script.
scriptName = outputPath + '\\FinishScript.spt';
FileUtils.ensureNotExistsFile(scriptName);
scriptGen = new ScriptGenerator();

let DSM = new BlockDSM(outputPath);
scriptGen.addBlockGenerator(DSM.generator);
let DTM = new BlockDTM(outputPath);
scriptGen.addBlockGenerator(DTM.generator);
let Orthos = new BlockOrthos(outputPath);
scriptGen.addBlockGenerator(Orthos.generator);
let Mosaic = new BlockMosaic(outputPath);
scriptGen.addBlockGenerator(Mosaic.generator);

fse.appendFileSync(scriptName, scriptGen.generateScript());



console.log('Finished!');