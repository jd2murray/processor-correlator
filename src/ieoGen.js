let xWriter = require('xml-writer');
import Image from './image';
import Camera from './camera';
import Projection from './wgs84Projection';

let cameraGroupID = 'GRP_001';
let cameraID = 'CAM_001';
let rootFolderID = 'DIR_1';

type ieoGenInitParams = { 
    images: Array<Image>,
    camera: Camera,
    imageFolder: string,
    projection : Projection
};


class ieoGen {

    _imageFolder: string;
    _images : Array<Image>;
    _camera : Camera;
    _projection : Projection;

    constructor(initParams: ieoGenInitParams) : void {
        this._imageFolder = initParams.imageFolder;
        this._images = initParams.images;
        this._camera = initParams.camera;
        this._projection = initParams.projection;
    }


    generate(xw: xWriter) {
        xw.startElement('InteriorExteriorOrientation')
            .writeAttribute('minimumVersion', '1.00')
            .writeAttribute('version', '1.00')
            .writeAttribute('xmlns:xsi', 'http://www.w3.org/2001/XMLSchema-instance')
            .writeAttribute('xsi:noNamespaceSchemaLocation', 'IEOSchema100.xsd')

            //<Sensor>
            .startElement('Sensor')
            .text('FrameBased')
            .endElement()

            //<Projection>
            .startElement('Projection')
            .startElement('Proj4')
            .text('+init=' + this._projection.projectionName)
            .endElement()
            .startElement('Description')
            .text('UTM WGS84 Zone ' + this._projection.projectionZone)
            .endElement()
            .endElement()

            //<RootFolders>
            .startElement('RootFolders')
            .startElement('RootFolder')
            .writeAttribute('id', rootFolderID)
            .text(this._imageFolder)
            .endElement()
            .endElement()

            //<CameraGroups>
            .startElement('CameraGroups')
            .startElement('CameraGroup')
            .writeAttribute('id', cameraGroupID)
            .endElement()
            .endElement()

            //<Cameras>
            .startElement('Cameras')
            .startElement('CameraDigital')
            .writeAttribute('group', cameraGroupID)
            .writeAttribute('id', cameraID)
            .startElement('Name')
            .text(this._camera.name)
            .endElement()
            .startElement('ImageWidth')
            .text(this._camera.imageWidth)
            .endElement()
            .startElement('ImageHeight')
            .text(this._camera.imageHeight)
            .endElement()
            .startElement('FocalLength')
            .text(this._camera.focalLength)
            .endElement()
            .startElement('PrincipalPoint')
            .writeAttribute('Xmm', '0')
            .writeAttribute('Ymm', '0;')
            .endElement()
            .startElement('PixelSize')
            .text(this._camera.pixelSize)
            .endElement()
            .endElement() //DigitalCamera
            .endElement() //Cameras

            //<Images>
            .startElement('Images');
        let frameNum = 0;
        this._images.forEach((image) => {
            let eastingNorthing = this._projection.getEastingNorthing(image.lat, image.long);
            xw.startElement('ImageFB')
                .writeAttribute('active', 'true')
                .writeAttribute('id', image.id)
                .startElement('Name')
                .writeAttribute('RootFolder', rootFolderID)
                .writeAttribute('SubFolder', '')
                .text(image.filename)
                .endElement()

                .startElement('Camera')
                .writeAttribute('ref', cameraID)
                .endElement()

                .startElement('Frame')
                .text(frameNum++)
                .endElement()
                .startElement('Position')
                .writeAttribute('easting', eastingNorthing[0])
                .writeAttribute('elevation', image.altitude)
                .writeAttribute('northing', eastingNorthing[1])
                .endElement()
                .startElement('Orientation')
                .writeAttribute('kappa', image.kappa)
                .writeAttribute('omega', '0.000000')
                .writeAttribute('phi', '0.000000')
                .endElement()
                .endElement();

        });
            xw.endElement()

            //<FlightLines>
            .startElement('FlightLines')
            .startElement('FlightLine')
            .writeAttribute('active', 'true')
            .writeAttribute('id', 'FL_000001');
        this._images.forEach((image) => {
            xw.startElement('Image')
                .writeAttribute('ref', image.id)
                .endElement();
        });
            xw.endElement()
            .endElement()

        //Finish the ieo
            .endElement()
    }
}

export default ieoGen;

