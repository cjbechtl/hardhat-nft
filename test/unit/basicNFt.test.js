const { assert } = require("chai");
const { network, deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
	? describe.skip
	: describe("Basic NFT Unit Tests", () => {
			let basicNft, deployer;

			beforeEach(async () => {
				// deploy BasicNft
				deployer = (await getNamedAccounts()).deployer;

				await deployments.fixture(["basicNft"]);
				basicNft = await ethers.getContract("BasicNft", deployer);
			});

			describe("Constructor", () => {
				it("initailizes nft correctly", async () => {
					const name = await basicNft.name();
					const symbol = await basicNft.symbol();
					const tokenCounter = await basicNft.getTokenCounter();
					assert.equal(name, "Doggie");
					assert.equal(symbol, "DOG");
					assert.equal(tokenCounter.toString(), "0");
				});
			});

			describe("mint nft", () => {
				beforeEach(async () => {
					const tx = await basicNft.mintNft();
					await tx.wait(1);
				});

				it("Allows users to mint an NFT, and updates appropriately", async () => {
					const tokenURI = await basicNft.tokenURI(0);
					const tokenCounter = await basicNft.getTokenCounter();

					assert.equal(tokenCounter.toString(), "1");
					assert.equal(tokenURI, await basicNft.TOKEN_URI());
				});
				it("Shows the correct balance and owner of an NFT", async () => {
					const deployerBalance = await basicNft.balanceOf(deployer);
					const owner = await basicNft.ownerOf("0");

					assert.equal(deployerBalance.toString(), "1");
					assert.equal(owner, deployer);
				});
			});
	  });
