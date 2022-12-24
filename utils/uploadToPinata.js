const pinataSDK = require("@pinata/sdk");
const path = require("path");
const fs = require("fs");
const PINATA_API_KEY = process.env.PINATA_API_KEY;
const PINATA_API_SECRET = process.env.PINATA_API_SECRET;
const pinata = new pinataSDK(PINATA_API_KEY, PINATA_API_SECRET);

const storeImages = async (imagesFilePath) => {
	const fullImagesPath = path.resolve(imagesFilePath);
	const files = fs.readdirSync(fullImagesPath);
	let responses = [];
	for (const fileIndex in files) {
		const readableStreamForFile = fs.createReadStream(`${fullImagesPath}/${files[fileIndex]}`);
		const options = {
			pinataMetadata: {
				name: files[fileIndex],
			},
		};
		try {
			const response = await pinata.pinFileToIPFS(readableStreamForFile, options);
			responses.push(response);
		} catch (e) {
			console.error(e);
		}
	}
	return { responses, files };
};

const storeTokenUriMetadata = async (metadata) => {
	const options = {
		pinataMetadata: {
			name: metadata.name,
		},
	};
	try {
		const response = await pinata.pinJSONToIPFS(metadata, options);
		return response;
	} catch (e) {
		console.error(e);
	}
	return null;
};

module.exports = { storeImages, storeTokenUriMetadata };
