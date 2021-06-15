const convert = require('./functions/convert');
const compress = require('./functions/compress');
const remove = require('./functions/remove');
const fs = require('fs');
const express = require('express');
const fileUpload = require('express-fileupload');

const app = express();
app.use(fileUpload());  // default options

app.listen(process.env.PORT || 8000, ()=>{
    console.log("Server is alive");
})

app.get("*", (req, res) => {
  res.sendFile(index.html)
})

app.post('/upload', function(req, res) {
  // The name of the input field (i.e. "uploadedFiles") is used to retrieve the uploaded file
  let uploadedFiles = req.files.uploadedFiles;    
  let uploadPath;

  if (!req.files || Object.keys(req.files).length === 0) {  // If no file was uploaded
    return res.status(400).send('No files were uploaded.');
  }  

  if(uploadedFiles.name == undefined){
    // console.log(uploadedFiles);


    let filesCount = uploadedFiles.length  // Number of uploaded files   
    let filesRecord = []  // for files path
    // console.log('Count = '+ filesCount);
    
    let folderName = 'your_files_'+ Math.floor(100000 + Math.random() * 900000)  // temp folder name
    let folderPath = './uploadedFiles/' + folderName  // temp folder path
    fs.mkdirSync(folderPath) // create temp folder
    
    uploadFiles() //setTimeout is used in each function for the next one respectively
    // encodeFiles() is 500ms, the rest are 200ms timeOut
    function uploadFiles(){
      uploadedFiles.forEach(file => { //upload all files   
        uploadPath =  folderPath + '/' + file.name;
        file.mv(uploadPath, function(err) { // Use the mv() method to place the file somewhere on your server
          if (err){
              return res.status(500).send(err);
          }
        });
        filesRecord.push(uploadPath)  // add a file name
      });

      setTimeout(encodeFiles, 500);
    }
    function encodeFiles(){
      filesRecord.forEach(file => {
        // console.log(file);
        convert(file)
      });
      setTimeout(zipFolder, 200);
    }
    function zipFolder(){
      compress(folderName, folderPath, filesRecord) 
      setTimeout(downloadZipFolder, 200); 
    }
    function downloadZipFolder(){ 
      res.download('./result/'+folderName+'.zip');
      setTimeout(removeFolderAndZip, 200); 
    }
    function removeFolderAndZip(){
      remove(folderPath)
      remove('./result/'+folderName+'.zip') 
    }

  }else{
    // console.log(uploadedFiles);

    let uploadPath = "./uploadedFiles/" + uploadedFiles.name //(uploadedFiles.name) is the original file name
    uploadedFiles.mv(uploadPath, function(err) { // Use the mv() method to place the file on server
      if (err){
        return res.status(500).send(err);
      }
    });
    setTimeout(() => { //encode file
      convert(uploadPath)
      setTimeout(() => { //download file
        res.download(uploadPath)
        setTimeout(() => { //delete file
          fs.unlink(uploadPath, (err => {
            if (err) console.log(err);
            // else {
            //   console.log("\nDeleted file: " + uploadPath);          
            // }
          }));
        }, 200);
      }, 200);
    }, 100);
  }

});
