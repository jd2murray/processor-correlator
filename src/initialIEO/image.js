const xfParse = require('exif-parser');
const fse = require('fs-extra');
const path = require('path');

var imageSerial = 1;
const IMAGE_NUMBER_LEN = 6;

class Image {

    _kappa: number;
    _lat: number;
    _long: number;
    _id: string;
    _filename: string;

    constructor(filename: string) {
        this._kappa = 0;
        this._lat = 0;
        this._long = 0;
        let imageNumber = '00000000' + imageSerial++;
        this._id = 'IMG_' + imageNumber.substr(imageNumber.length - IMAGE_NUMBER_LEN); //js strange formatting number...
        this._filename = filename;
    }

    static MAX_XIF = 65555;

    readData() {
        let fd;
        let bufSize;
        try {
            fd = fse.openSync(this._filename, 'r');
        } catch (err) {
            throw 'Error opening ' + this._filename + ' for parsing';
        }
        try {
            let stats = fse.statSync(this._filename);
            bufSize = Math.min(stats.size, Image.MAX_XIF);
        } catch (err) {
            throw 'Error reading file size.';
        }
        let imgBuffer = new Buffer(bufSize);
        try {
            fse.readSync(fd, imgBuffer, 0, bufSize, 0);
        }
        catch (err) {
            throw 'Error reading EXIF from file';
        }
        let parser = xfParse.create(imgBuffer);
        let result = parser.parse();
        
        this._kappa = result.tags.GPSImgDirection;
        this._kappa = this._kappa ? this._kappa / 10 : 0;
        
        this._lat =  result.tags.GPSLatitude;
        this._long = result.tags.GPSLongitude;
        
        this._altitude = result.tags.GPSAltitude;
        
        //console.log(JSON.stringify(result));
    }

    get kappa() : number {
        return this._kappa;
    }
    
    get lat() : number {
        return this._lat;
    }
    
    get long() : number {
        return this._long;
    }

    get altitude() : number {
        return this._altitude;
    }
    
    get id() : string {
        return this._id;
    }
    
    get filename() : string {
        return path.parse(this._filename).base;
    }
}

export default Image;