type cameraInitParams = {
    name: string,
    imageWidth: number,
    imageHeight: number,
    focalLength: number,
    pixelSize: number
}


class Camera {
    _name: string;
    _imageWidth: number;
    _imageHeight: number;
    _focalLength: number;
    _pixelSize: number;
    
    constructor(params : cameraInitParams) {
        this._name = params.name;
        this._imageWidth = params.imageWidth;
        this._imageHeight = params.imageHeight;
        this._focalLength = params.focalLength;
        this._pixelSize = params.pixelSize;
    }
    
    get name() : string {
        return (this._name);
    }
    
    get imageWidth() : number {
        return (this._imageWidth);
    }
    
    get imageHeight() : number {
        return this._imageHeight;
    }
    
    get focalLength() : number {
        return this._focalLength;
    }
    
    get pixelSize() : number {
        return this._pixelSize;
    }
}

export default Camera;