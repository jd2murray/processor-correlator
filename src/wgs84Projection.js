const Proj4 = require('proj4');

//source for lat/long from cameras.
const sourceProj : Proj4.Proj = new Proj4.Proj('WGS84');

class wgs84Projection {
    _projection: ?Proj4.Proj;
    _projectionName : string;
    _projectionZone: string;

    constructor () {
        this._projection = null;
        this._projectionName = '';
        this._projectionZone = '';
    }

    setProjection (proj : Proj4.Proj, name : string, zone: string) {
        this._projection = proj;
        this._projectionName = name;
        this._projectionZone = zone;
    }

    calculateProjection(lat : number, long : number) {
        //The following will work outside of certain exceptions - see here: https://en.wikipedia.org/wiki/Universal_Transverse_Mercator_coordinate_system#Exceptions
        //Code lifted from overflow here: http://gis.stackexchange.com/questions/13291/computing-utm-zone-from-lat-long-point
        //https://en.wikipedia.org/wiki/Universal_Transverse_Mercator_coordinate_system
        //This page also has computation for the latitude letter designation: http://www.igorexchange.com/node/927
        let zone = (Math.floor((long + 180) / 6) % 60) + 1;

        // Special for Norway?
        if (lat >= 56.0 && lat < 64.0 && long >= 3.0 && long < 12.0) {
            zone = 32;
        }
        // Special zones for Svalbard
        if (lat >= 72.0 && lat < 84.0) {
            if (long >= 0.0 && long < 9.0) {
                zone = 31;
            }
            else if (long >= 9.0 && long < 21.0) {
                zone = 33;
            }
            else if (long >= 21.0 && long < 33.0) {
                zone = 35;
            }
            else if (LongTemp >= 33.0 && LongTemp < 42.0) {
                zone = 37;
            }
        }

        //Compute latitude letter designation (N/S).
        let latLetter = 'N';
        if(lat < 0) {
            latLetter = 'S';
        }

        this._projectionName = 'EPSG:326' + zone;
        Proj4.defs(this._projectionName, '+proj=utm +zone=' + zone + ' +datum=WGS84 +units=m +no_defs');
        this._projection = new Proj4.Proj(this._projectionName);
        this._projectionZone = '11' + latLetter;
    }

    get projectionName() : string {
        return this._projectionName;
    }
    
    get projectionZone() : string {
        return this._projectionZone;
    }
    
    getEastingNorthing(lat : number, long : number) : Array<number> {
        if(this._projection) {
            return Proj4(sourceProj, this._projection).forward([long, lat]);
        } else {
            throw new Error('attempted to getEasting/Northing without first setting a projection.')
        }
    }
}

export default wgs84Projection;