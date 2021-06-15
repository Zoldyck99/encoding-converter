const fs = require('fs')
let encoder = require("iconv-lite");
// let detector = require("jschardet")

function convert(path){
    fs.readFile(path, (err, data) => {
      if (err) {
        console.error(err)
        return
      }
      let txt = encoder.decode(data, 'utf-8');

      write(path, txt)
    })
}
function write(path, txt){
  fs.writeFileSync(path, txt)
  // console.log("encoded !")
}

module.exports = convert