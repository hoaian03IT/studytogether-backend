const axios = require("axios");
const fs = require("fs");

function imageToBlobLocal(imagePath) {
    return fs.readFileSync(imagePath);
}

async function imageToBlobPromise(imageUrl) {
    try {
        const { data } = await axios.get(imageUrl, { responseType: "arrayBuffer" });
        const buffer = Buffer.from(data, "binary");
        return buffer;
    } catch (error) {
        throw new Error(`Error downloading image: ${error.message}`);
    }
}

module.exports = { imageToBlobLocal, imageToBlobPromise };
