import fse from 'fs-extra';

class IEOName {
    static _possibleFiles = [
        '\\IEO\\Initial\\Initial.ieo',
        '\\IEO\\Initial\\Initial_AT.ieo',
        '\\IEO\\Step_1\\Step_1.ieo',
        '\\IEO\\Step_2\\Step_2.ieo',
        '\\IEO\\Step_3\\Step_3.ieo',
        '\\IEO\\Step_4\\Step_4.ieo'
    ];

    static _getLatestIndex(rootFolder : string) : number {
        let possibleFilesLength = IEOName._possibleFiles.length;
        let retVal = -1;
        for(let i = 0; i<possibleFilesLength; i++) {
            let possibility = rootFolder + IEOName._possibleFiles[i];
            let stat;
            try {
                stat = fse.statSync(possibility);
            } catch (err) {
                //If the file is unable to be 'stated, then not found.
                stat = null;
            }
            if(stat && stat.isFile()) {
                retVal++;
            } else {
                break;
            }
        }
        
        return(retVal);
    }
    
    static getLatest(rootFolder : string) : string {
        let latestIndex = IEOName._getLatestIndex(rootFolder);
        
        if(latestIndex !== -1) {
            return (rootFolder + IEOName._possibleFiles[latestIndex])
        } else {
            throw new Error('Error - no .ieo found!');
        }
    }
    
    static getNext(rootFolder : string) : string {
        let latestIndex = IEOName._getLatestIndex(rootFolder);

        return (rootFolder + IEOName._possibleFiles[latestIndex + 1]);
    }
}

export default IEOName;
