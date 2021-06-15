const del = require('del');

function deleteFolder(path){

    // delete directory recursively
    (async () => {
        try {
            await del(path);

            console.log(`${path} is deleted!`);
        } catch (err) {
            console.error(`Error while deleting ${path}.`);
        }
    })();
}

module.exports = deleteFolder
