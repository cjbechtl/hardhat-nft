const { network } = require("hardhat");
const { developmentChains, networkConfig } = require("../helper-hardhat-config");
const { verify } = require("../utils/verify");
const { storeImages, storeTokenUriMetadata } = require("../utils/uploadToPinata");

const imagesLocation = "./images/randomNft/";
const VRF_SUB_FUND_AMOUNT = "1000000000000000000000";
const metaDataTemplate = {
	name: "",
	description: "",
	image: "",
	attributes: {
		trait_type: "Cuteness",
		value: 100,
	},
};

module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const chainId = network.config.chainId;
	let tokenUris = [
		"ipfs://QmYAeEtmSSK7dP4Lrtakmyt5sfaktV1dsXQqTjnWL1oqFS",
		"ipfs://QmdfjeVDHWGkQcDMnaEPBsVXoEgagemxo4EBFvtWiaAbPM",
		"ipfs://QmfABqDshMFoTpqRtBYBE77wEs9fVxdDxS5DFxKeXL2DRC",
	];

	// get IPFS hashes of out images

	if (process.env.UPLOAD_TO_PINATA === "true") {
		tokenUris = await handleTokenUris();
	}

	let vrfCoordinatorV2Mock, vrfCoordinatorV2Address, subscriptionId;

	if (developmentChains.includes(network.name)) {
		vrfCoordinatorV2Mock = await ethers.getContract("VRFCoordinatorV2Mock");
		vrfCoordinatorV2Address = vrfCoordinatorV2Mock.address;
		const transactionResponse = await vrfCoordinatorV2Mock.createSubscription();
		const transactionReceipt = await transactionResponse.wait(1);
		subscriptionId = transactionReceipt.events[0].args.subId;
		await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, VRF_SUB_FUND_AMOUNT);
	} else {
		vrfCoordinatorV2Address = networkConfig[chainId]["vrfCoordinatorV2"];
		subscriptionId = networkConfig[chainId]["subscriptionId"];
	}

	await storeImages(imagesLocation);

	const gasLane = networkConfig[chainId].gasLane;
	const callbackGasLimit = networkConfig[chainId].callbackGasLimit;
	const mintFee = networkConfig[chainId].mintFee;

	const args = [
		vrfCoordinatorV2Address,
		subscriptionId,
		gasLane,
		callbackGasLimit,
		tokenUris,
		mintFee,
	];

	const randomIpfsNft = await deploy("RandomIpfsNft", {
		from: deployer,
		args,
		log: true,
		waitConfirmations: network.config.blockConfirmations || 1,
	});

	console.log("RandomIpfsNft deployed at: ", randomIpfsNft.address);

	if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
		await verify(randomIpfsNft.address, args);
	}
	log("---------------------------------------");
};

const handleTokenUris = async () => {
	const tokenUris = [];
	const { responses: imageUpladResonses, files } = await storeImages(imagesLocation);

	for (const imageUpladResonseIndex in imageUpladResonses) {
		let tokenUriMetadata = { ...metaDataTemplate };
		tokenUriMetadata.name = files[imageUpladResonseIndex].replace(".png", "");
		tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name} pup!`;
		tokenUriMetadata.image = `ipfs://${imageUpladResonses[imageUpladResonseIndex].IpfsHash}`;

		// store the file
		const metaDataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata);
		tokenUris.push(`ipfs://${metaDataUploadResponse.IpfsHash}`);
	}
	console.log("token uris uploaded: ", tokenUris);
	return tokenUris;
};

module.exports.tags = ["all", "randomIpfsNft"];
