const del = require('del');
const fs = require('fs');
const path = require('path');

/**
 * @param  {String} tempFolderPath self explanatory
 * @param  {String} uploadField uploaded files object
 * @param  {Number} wait timeOut after uploading to avoid shit
 */
const uploadFiles = async (tempFolderPath, uploadField, wait) => {
    let filesRecord = [] // Record for all uploaded files
    let uploadPath;
    await uploadField.forEach(file => {
        uploadPath = path.join(tempFolderPath, file.name)
        file.mv(uploadPath, err => {
            if (err){
                throw err;
            }
        })
        filesRecord.push(uploadPath)  // add a file name
    })
    await new Promise(resolve => setTimeout(resolve, wait));
    console.log(`Uploaded`)
    return filesRecord;
}
/**
 * @param  {String} uploadPath self explanatory
 * @param  {String} file uploaded file object
 * @param  {Number} wait timeOut after uploading to avoid shit
 */
const uploadFile = async (uploadPath, file, wait) => {
    await file.mv(uploadPath, function(err) {
        if (err){
          console.error(`${err}`)
        }
    });
    await new Promise(resolve => setTimeout(resolve, wait));
    console.log(`Uploaded`)
}

/** 
 * creates a temp dir to store files in
 */
const createTempFolder = async () => {
    let tempName = 'your_files_'+ Date.now()  // temp folder name
    let tempPath = path.join('uploads', tempName)  // temp folder path
    fs.mkdir(tempPath, (err) => {
        if (err) {
            throw err;
        }
        console.log('Directory created');
    })
    return {tempPath, tempName}
}

/**
 * @param  {String} dirPath path to the temp dir
 * @param  {String} zipPath path to the zip file
 */
const deleteEverything = async (dirPath, zipPath) => {
    try {
        const deleteDir = del(dirPath)
        const deleteZip = fs.unlink(zipPath, (err) => {
            if (err) throw err;
        })

        await Promise.all([deleteDir, deleteZip])
        console.log(`Deleted`)
    } catch (err) {
        console.error(err)
    }
}

const deleteFile = async (path) => {
    await Promise.resolve().then(() => {
        fs.unlink(path, (err) => {
            if (err) throw err;
        })
    }) 
    console.log(`Deleted`)
}

module.exports = {deleteEverything, deleteFile, createTempFolder, uploadFiles, uploadFile}
