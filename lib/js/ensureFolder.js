const fs = require('fs');
const path = require('path');

function ensureFolder(url) {
    if (fs.existsSync(url)) {
        return true;
    }

    ensureFolder(path.dirname(url));
    fs.mkdirSync(url);
}

module.exports = ensureFolder;