const path = require('path');
const {zip} = require('zip-a-folder');
/**
 * @param  {Object} tempDir temp folder object
 * @param  {String} SaveToDir path to save zip folder to
 * 
 * @returns zip path
 */
const compress = async (tempDir, SaveToDir) =>{
    try {
        let zipName = tempDir.tempName+'.zip'
        let zipPath = path.join(SaveToDir, zipName)
        await zip(tempDir.tempPath, zipPath, {compression: 9})
        console.log("Zipped");
        
        return zipPath;
    } catch (err) {
        console.error(err);
    }
}

module.exports = compress