const { v2: cloudinary } = require("cloudinary");

async function uploadImage(image, arrayTags) {
	const upload = await cloudinary.uploader.upload(image, {
		asset_folder: "/course-images",
		tags: arrayTags,
		quality: 50,
		resource_type: "image",
	});
	return upload.url;
}

async function uploadAudio(audio, arrayTags) {
	const upload = await cloudinary.uploader.upload(audio, {
		asset_folder: "/audios",
		tags: arrayTags,
		quality: 100,
		resource_type: "video",
	});
	return upload.url;
}

module.exports = { uploadImage, uploadAudio };