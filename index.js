const path = require('path')
const fs = require('fs')
const {convert, convertFile, getFilesRecord, encodingSupported} = require('./functions/convert');
const compress = require('./functions/compress');
const {deleteEverything, deleteFile, createTempFolder, uploadFiles, uploadFile} = require('./functions/dirStuff');
const express = require('express');
const fileUpload = require('express-fileupload');
const unzipper = require('unzipper');

const app = express();
app.use('/upload', fileUpload());  // default options
app.use((req, res, next) => { // allow cors for any response to client side
  res.append('Access-Control-Allow-Origin', 'https://encoding-converter.netlify.app')
  next()
})


app.get("/encodingSupported", (req, res) => { // check if encoding is supported
  res.send(encodingSupported(req.query.type))
})
app.get("/wakeUp", (req, res) => {  // wake up the server once the website is visited
  res.send("Wasssap my nigga")
})
app.post('/upload', function(req, res) {  // handle uploads

  let {uploadField} = req.files // The name of the html input field is used to retrieve the uploaded files
  if (!req.files || Object.keys(req.files).length === 0) {  // If no files were uploaded
    return res.status(400).send('No files were uploaded.');
  }  

  const manyFilesUpload = () => {
    var tempDir;
    createTempFolder()  // create temp dir
    .then(tempDetails => {  // Upload with timeOut 10ms (+5ms per file)
      tempDir = tempDetails
      return uploadFiles(tempDir.tempPath, uploadField, 10+(uploadField.length*5))
    })
    .then(filesRecord => convert(req.body.from, req.body.to, filesRecord)) // encode
    .then(() => { // zip with prior timeOut +0.5ms per file
      return (async () => {
        await new Promise(resolve => setTimeout(resolve, uploadField.length/2));
        return compress(tempDir, path.join('result'))
      })()
    })
    .then((zipPath) => {  // download & Delete
      res.download(zipPath, (err) => {
        if(err) console.error(`${err}`)
        else console.log(`Downloaded`)
        
        deleteEverything(tempDir.tempPath, zipPath)
      })
    })
    .catch(err => {
      console.error(`${err}`)
      res.status(500).send(err);
    })

  }
  const singleFileUpload = () => {
    uploadFile(uploadPath, uploadField, (uploadField.size/10000)) // upload & wait +1ms per 10kb
    .then(() => {  // convert & wait 10ms (+1ms per 1kb)
      return (async () => {
        let file = await convertFile(req.body.from, req.body.to, uploadPath)
        await new Promise(resolve => setTimeout(resolve, 10+(uploadField.size/1000)));
        return file;
      })()
    })
    .then((file) => { // download & Delete
      res.download(file, (err) => {
        if(err) console.error(`${err}`)
        else console.log(`Downloaded`)
        
        deleteFile(file)
      })
    })
    .catch(err => {
      console.error(`${err}`)
      res.status(500).send(err);
    })
  }
  const manyZipsUpload = () => {
    uploadFile(uploadPath, uploadField[0], (uploadField[0].size/10000)) // upload & wait +1ms per 10kb
    .then(() => createTempFolder()) // create temp dir
    .then(tempDir => {  // unzip into temp dir
      (async () => {
        tmpDetails = tempDir;
        fs.createReadStream(uploadPath)
        .pipe(unzipper.Extract({ path: tmpDetails.tempPath }));
        console.log(`Unzipped`);
      })();
    })
    .then(() => {  // get filesRecord[] with prior timeOut +2ms per kb
      return (async() => {
        await new Promise(resolve => setTimeout(resolve, (uploadField[0].size/500)));
        return getFilesRecord(tmpDetails.tempPath)
      })()
    })
    .then(filesRecord => convert(req.body.from, req.body.to, filesRecord)) //encode
    .then(() => { // zip with prior timeOut +0.5ms per file
      return (async () => {
        await new Promise(resolve => setTimeout(resolve, uploadField[0].length/2));
        return compress(tmpDetails, path.join('result'))
      })()
    })
    .then((zipPath) => {  // download & delete
      res.download(zipPath, (err) => {
        if(err) console.error(`${err}`)
        else console.log(`Downloaded`)
        
        deleteFile(uploadPath)  // delete user's zip
        deleteEverything(tmpDetails.tempPath, zipPath) // delete everything
      })
    })
    .catch(err => {
      console.error(`${err}`)
      res.status(500).send(err);
    })
  }
  const singleZipUpload = () => {
    uploadFile(uploadPath, uploadField, (uploadField.size/10000)) // upload & wait +1ms per 10kb
    .then(() => createTempFolder()) // create temp dir
    .then(tempDir => {  // unzip into temp dir
      (async () => {
        tmpDetails = tempDir;
        fs.createReadStream(uploadPath)
        .pipe(unzipper.Extract({ path: tmpDetails.tempPath }));
        console.log(`Unzipped`);
      })();
    })
    .then(() => {  // get filesRecord[] with prior timeOut +2ms per kb
      return (async() => {
        await new Promise(resolve => setTimeout(resolve, (uploadField.size/500)));
        return getFilesRecord(tmpDetails.tempPath)
      })()
    })
    .then(filesRecord => convert(req.body.from, req.body.to, filesRecord)) //encode
    .then(() => { // zip with prior timeOut +0.5ms per file
      return (async () => {
        await new Promise(resolve => setTimeout(resolve, uploadField.length/2));
        return compress(tmpDetails, path.join('result'))
      })()
    })
    .then((zipPath) => {  // download & delete
      res.download(zipPath, (err) => {
        if(err) console.error(`${err}`)
        else console.log(`Downloaded`)
        
        deleteFile(uploadPath)  // delete user's zip
        deleteEverything(tmpDetails.tempPath, zipPath) // delete everything
      })
    })
    .catch(err => {
      console.error(`${err}`)
      res.status(500).send(err);
    })
  }


  if(uploadField.name == undefined){ // Many files
    if(uploadField[0].mimetype == 'application/x-zip-compressed'){ // many zips, do one & ignore the rest [for now, perhaps upgrade in the future]
      
      var uploadPath = path.join('uploads', uploadField[0].name) // save with the original file name
      var tmpDetails;
      manyZipsUpload()
    }else{
      manyFilesUpload();
    }
  }else{  // single zip or a single file
    
    var uploadPath = path.join('uploads', uploadField.name) // save with the original file name
    var tmpDetails;

    if(uploadField.mimetype == 'application/x-zip-compressed'){ // single zip
      singleZipUpload();
    }else{  // single file
      singleFileUpload()
    }
  }
});


app.listen(process.env.PORT || 8000, ()=>{
  console.log("Server is alive");
})