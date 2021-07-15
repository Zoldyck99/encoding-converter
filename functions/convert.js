const fs = require('fs')
const path = require('path')
const iconv = require("iconv-lite");
let detector = require("jschardet");
const { isArray } = require('util');

/**
 * @param  {String} type check if iconv-lite support this encoding
 * @returns {Boolean} true if [supported] utf-* with BOM is detected, otherwise returns iconv validation 
 */
const encodingSupported = (to) => {
  if(to.toLowerCase().includes('bom')){
    to = polishUserInput(to)
    return (to.search(/(utf16|utf16be|utf16le|utf8|utf7|utf7imap)/g) > -1)
  }else{
    return iconv.encodingExists(to)
  }
}
/**
 * @param  {Buffer} buffer
 * @returns {String} detected encoding
 */
const checkEncoding = (buffer) => {
  return detector.detect(buffer, { minimumThreshold: 0 }).encoding
}
/**
 * @param  {String} input user input
 * @returns {String} input String without [-] or white spaces
 */
const polishUserInput = (input) => {
  return input.toLowerCase().replace(/[\s\-]+/g, '');
}


/**
 * @param  {String} from  original encoding
 * @param  {String} to  convert to
 * @param  {String} filesRecord intended files
 */
const convert = async (from, to, filesRecord) => {
  let node_encodings = ["ascii" , "utf8", "utf16le", "ucs2" , "base64" , "base64url" , "latin1" , "binary" , "hex"]
  var toBOM = false;
  from = polishUserInput(from)
  to = polishUserInput(to)
  if(to.includes("bom")){ //determine which utf-* encoding is desired
    toBOM = true;
    to = to.match(/(utf16be|utf16le|utf16|utf8|utf7imap|utf7)/)[0] // be cautious when changing the order of the encodings in the RegExp
  }
  var node_to = to; //to be used if user's [to] is not supported by node
  if(!node_encodings.includes(node_to)){  // this is needed because eventually data will be written on the file using node's encodings   
    if(to == "utf16"){node_to = "utf16le"} // utf16 default is [utf16le] in node
    else{node_to = "utf8"} // default fallback is utf8
  }

  // console.log(`from: ${from}`)
  // console.log(`to: ${to}`)
  // console.log(`node_encodings_to: ${node_to}`)
  const handleKnwFrom = async () => {
    if(toBOM){ // if [to] is utf-* with BOM
      await encode(filesRecord, from, to, true, node_to)
    }else{
      if(to == 'utf8'){ // don't include BOM 
        await encode(filesRecord, from, to, false, node_to)        
      }else{  // include BOM (does not hurt & produce a better quality utf-16)
        await encode(filesRecord, from, to, true, node_to)
      }
    }
  }
  const handleUnkFrom = async () => {
    if(toBOM){ // if [to] is utf-* with BOM
      await encodeUnkFrom(filesRecord, to, true, node_to)
    }else{
      if(to == 'utf8'){ // don't include BOM 
        await encodeUnkFrom(filesRecord, to, false, node_to)
      }else{  // include BOM (does not hurt & produce a better quality utf-16)
        await encodeUnkFrom(filesRecord, to, true, node_to)
      }
    }
  }

  if(iconv.encodingExists(from)){ // if user's [from] is supported by iconv
    await handleKnwFrom()

  }else{  // [from] is not recognized by iconv
    if(from.includes("bom")){ // [from] is utf-* with BOM

      from = from.match(/(utf16be|utf16le|utf16|utf8|utf7imap|utf7)/) // be cautious when changing the order of the encodings in the RegExp
      if(from == undefined){from = 'utf8'}else{from = from[0]} // default fallback is utf8
      await handleKnwFrom()

    }else{  // if user didn't specify a [from]
      await handleUnkFrom()

    }
  }

  console.log(`Encoded`)
}
/**
 * @param  {String} from decode from
 * @param  {String} to encode to
 * @param  {String} file path to the file
 * 
 * @returns file path
 */
const convertFile = async (from, to, file) => {
  let node_encodings = ["ascii" , "utf8", "utf16le", "ucs2" , "base64" , "base64url" , "latin1" , "binary" , "hex"]
  var toBOM = false;

  from = polishUserInput(from)
  to = polishUserInput(to)
  if(to.includes("bom")){ //determine which utf-* encoding is desired
    toBOM = true;
    to = to.match(/(utf16be|utf16le|utf16|utf8|utf7imap|utf7)/)[0] // be cautious when changing the order of the encodings in the RegExp
  }
  var node_to = to; //to be used if user's [to] is not supported by node
  if(!node_encodings.includes(node_to)){  // this is needed because eventually data will be written on the file using node's encodings   
    if(to == "utf16"){node_to = "utf16le"} // utf16 default is [utf16le] in node
    else{node_to = "utf8"} // default fallback is utf8
  }


  const handleKnwFrom = async () => {
    if(toBOM){ // if [to] is utf-* with BOM
      await encode(file, from, to, true, node_to)
    }else{
      if(to == 'utf8'){ // don't include BOM 
        await encode(file, from, to, false, node_to)        
      }else{  // include BOM (does not hurt & produce a better quality utf-16)
        await encode(file, from, to, true, node_to)
      }
    }
  }
  const handleUnkFrom = async () => {
    if(toBOM){ // if [to] is utf-* with BOM
      await encodeUnkFrom(file, to, true, node_to)
    }else{
      if(to == 'utf8'){ // don't include BOM 
        await encodeUnkFrom(file, to, false, node_to)
      }else{  // include BOM (does not hurt & produce a better quality utf-16)
        await encodeUnkFrom(file, to, true, node_to)
      }
    }
  }


  if(iconv.encodingExists(from)){ // if user's [from] is supported by iconv
    await handleKnwFrom()
  }else{  // [from] is not recognized by iconv
    if(from.includes("bom")){ // [from] is utf-* with BOM
      from = from.match(/(utf16be|utf16le|utf16|utf8|utf7imap|utf7)/) // be cautious when changing the order of the encodings in the RegExp
      if(from == undefined){from = 'utf8'}else{from = from[0]} // default fallback is utf8
      await handleKnwFrom()
    }else{  // if user didn't specify a [from]
      await handleUnkFrom()
    }
  }


  console.log(`Encoded`)
  return file
}
/**
 * @param  {String} tempPath path to temp dir
 * @returns filesRecord Array
 * 
 * used to get filesRecord Array from the temp dir, to be used for encoding process
 */
const getFilesRecord = async (tempPath) => {
  try {
    var filesRecord = []
    return await fs.promises.readdir(tempPath)
    .then(files => {
      files.forEach(file => {
        filesRecord.push(path.join(tempPath, file))
      });
      return filesRecord
    })  
  } catch (err) {
    console.error(err);
  }
}

/**
 * @param  {Array | String} files all files to be converted
 * @param  {String} from decode from
 * @param  {String} to encode to
 * @param  {Boolean} BOM true: add BOM
 * @param  {String} node_to node compatible encoding (for writing on files)
 */
const encode = async (files, from, to, BOM, node_to) => {
  var txt;
  if(Array.isArray(files)){ // many files
    files.forEach(file => {
      fs.readFile(file, (err, data) => {
        if (err) {
          throw err
        }

        try {
          txt = iconv.decode(data, from, {stripBOM: true}) // decode data buffer
          txt = iconv.encode(txt, to, {addBOM: BOM})  //encode txt string
          write(file, txt, node_to) //write to the file
  
        } catch (err) {
          console.error(err);
        }
      })      
    });
  }else{ // single file
    fs.readFile(files, (err, data) => {
      if (err) {
        throw err
      }

      try {
        txt = iconv.decode(data, from, {stripBOM: true}) // decode data buffer
        txt = iconv.encode(txt, to, {addBOM: BOM})  //encode txt string
        write(files, txt, node_to) //write to the file
  
      } catch (err) {
        console.error(`${err}`)
      }
    })
  }
}
/**
 * @param  {Array|String} filesRecord all files to be converted
 * @param  {String} to encode to
 * @param  {Boolean} BOM true: add BOM
 * @param  {String} node_to node compatible encoding (for writing on files)
 */
const encodeUnkFrom = async (filesRecord, to, BOM, node_to) => {
  var txt;
  var from;
  if(Array.isArray(filesRecord)){  // many files
    filesRecord.forEach(file => {
      fs.readFile(file, (err, data) => {
        if (err) {
          console.error(`${err}`)
          throw err
        }

        try {
          from = checkEncoding(data)
          if(!iconv.encodingExists(from)){
            from = 'utf8'
          }
          txt = iconv.decode(data, from, {stripBOM: true}) // decode data buffer
          txt = iconv.encode(txt, to, {addBOM: BOM})  //encode txt string
          write(file, txt, node_to) //write to the file
          
        } catch (err) {
          console.error(err);
        }
      })      
    });
  }else{  // single file
    fs.readFile(filesRecord, (err, data) => {
      if (err) {
        throw err
      }

      try {
        from = checkEncoding(data)
        if(!iconv.encodingExists(from)){
          from = 'utf8'
        }
        txt = iconv.decode(data, from, {stripBOM: true}) // decode data buffer
        txt = iconv.encode(txt, to, {addBOM: BOM})  //encode txt string
        write(filesRecord, txt, node_to) //write to the file        
      } catch (err) {
        console.error(err);
      }
    })      
  }  
}


/**
 * @param  {String} path file path
 * @param  {Buffer} data Buffer data
 * @param  {String} to encoding to save with
 */
const write = (path, data, to) => {
  try {
    fs.writeFile(path, data, {encoding: to}, (err) => {
      if(err){
        console.err(err)
      }
    })    
  } catch (err) {
    console.error(err);
  }
}



module.exports = {convert, convertFile, getFilesRecord, encodingSupported}