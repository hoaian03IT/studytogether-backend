const fs = require("fs");

const imageToBlob = (imagePath) => {
    return fs.readFileSync(imagePath);
};

module.exports = imageToBlob;
