var program = require('commander');
let fse = require('fs-extra');
let pkg = JSON.parse(fse.readFileSync('package.json', 'utf8'));
let xWriter = require('xml-writer');
import ieoGen from './ieoGen';
import Image from './image';
import Projection from './wgs84Projection';
import Camera from './camera';
import ScriptGenerator from './c3dScript/scriptGenerator';
import BlockAT from './c3dScript/blockAT';

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


function ensureExistsDir(path) {
    try {
        fse.mkdirSync(path, 0o777)
    } catch (err) {
        if (err.code != 'EEXIST') { // ignore the error if the folder already exists
            errExit(new Error('Error creating/ensuring directory exists: ' + err.message));
        }
    }
}

function ensureNotExistsFile(path) {
    try {
        fse.unlinkSync(path)
    }
    catch (e) {
        //Nothing - assume failure is because the file didn't exist in the first place.
    }
}

//Ensure the directory for IEO exists...
ensureExistsDir(outputPath);
ensureExistsDir(outputPath + '\\IEO');
ensureExistsDir(outputPath + '\\IEO' + '\\Initial');

let ieoName = outputPath + '\\IEO\\Initial\\Initial.ieo';
ensureNotExistsFile(ieoName);
fse.appendFileSync(ieoName, xw.toString());


//Assemple and write the AT script.
let AT = new BlockAT(outputPath);
let scriptGen = new ScriptGenerator();

scriptGen.addBlockGenerator(AT.generator);
let scriptName = outputPath + '\\script.spt';
ensureNotExistsFile(scriptName);
fse.appendFileSync(scriptName, scriptGen.generateScript());

console.log('Finished!');