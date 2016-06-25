let fse = require('fs-extra');

class FileUtils {
    static ensureExistsDir(path, errCB) {
        try {
            fse.mkdirSync(path, 0o777)
        } catch (err) {
            if (err.code != 'EEXIST') { // ignore the error if the folder already exists
                errCB(new Error('Error creating/ensuring directory exists: ' + err.message));
            }
        }
    }

    static ensureNotExistsFile(path) {
        try {
            fse.unlinkSync(path)
        }
        catch (e) {
            //Nothing - assume failure is because the file didn't exist in the first place.
        }
    }
}

export default FileUtils;
