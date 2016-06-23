var program = require('commander');
let fse = require('fs-extra');
let pkg = JSON.parse(fse.readFileSync('package.json', 'utf8'));
let xWriter = require('xml-writer');
import ieoGen from './ieoGen';
import Image from './image';
import Projection from './wgs84Projection';
import Camera from './camera';

let path = require('path');

program
    .version(pkg.version)
    .option('-d, --directory <directory>', 'Directory which contains the images')
    .option('-o, --output <output>', 'Output filename')
    .parse(process.argv);

if(!program.output ||
    !program.directory) {
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

//Remove file
try {
    fse.unlinkSync(program.output);
}
catch(e) {
    //nothing; just eat it if the file had problems deleting - probable it is a new file.
}

//Dump XML to file.
fse.appendFileSync(program.output, xw.toString());

console.log('Finished!');