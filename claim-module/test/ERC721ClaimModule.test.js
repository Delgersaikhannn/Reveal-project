const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ERC721ClaimModule", function () {
  let claimModule;
  let mockNFT;
  let owner;
  let user1;
  let user2;

  beforeEach(async function () {
    [owner, user1, user2] = await ethers.getSigners();

    // Deploy mock ERC721
    const MockERC721 = await ethers.getContractFactory(
      "contracts/test/MockERC721.sol:MockERC721",
    );
    mockNFT = await MockERC721.deploy("Test NFT", "TNFT");
    await mockNFT.waitForDeployment();

    // Deploy ERC721ClaimModule
    const ERC721ClaimModule =
      await ethers.getContractFactory("ERC721ClaimModule");
    claimModule = await ERC721ClaimModule.deploy();
    await claimModule.waitForDeployment();
  });

  describe("verify", function () {
    it("Should return true when user owns at least 1 NFT", async function () {
      // Mint NFT to user1
      await mockNFT.mint(user1.address, 1);

      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [await mockNFT.getAddress()],
      );

      const result = await claimModule.verify(user1.address, data);
      expect(result).to.equal(true);
    });

    it("Should return false when user owns 0 NFTs", async function () {
      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [await mockNFT.getAddress()],
      );

      const result = await claimModule.verify(user2.address, data);
      expect(result).to.equal(false);
    });

    it("Should return true when user owns multiple NFTs", async function () {
      // Mint multiple NFTs to user1
      await mockNFT.mint(user1.address, 1);
      await mockNFT.mint(user1.address, 2);
      await mockNFT.mint(user1.address, 3);

      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [await mockNFT.getAddress()],
      );

      const result = await claimModule.verify(user1.address, data);
      expect(result).to.equal(true);
    });

    it("Should return false after user transfers away their last NFT", async function () {
      // Mint and transfer
      await mockNFT.mint(user1.address, 1);
      await mockNFT
        .connect(user1)
        .transferFrom(user1.address, user2.address, 1);

      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [await mockNFT.getAddress()],
      );

      const result = await claimModule.verify(user1.address, data);
      expect(result).to.equal(false);
    });

    it("Should work with different NFT contracts", async function () {
      // Deploy second NFT contract
      const MockERC721 = await ethers.getContractFactory(
        "contracts/test/MockERC721.sol:MockERC721",
      );
      const mockNFT2 = await MockERC721.deploy("Test NFT 2", "TNFT2");
      await mockNFT2.waitForDeployment();

      // Mint from first contract to user1
      await mockNFT.mint(user1.address, 1);

      // Mint from second contract to user2
      await mockNFT2.mint(user2.address, 1);

      const data1 = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [await mockNFT.getAddress()],
      );
      const data2 = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [await mockNFT2.getAddress()],
      );

      // user1 owns mockNFT but not mockNFT2
      expect(await claimModule.verify(user1.address, data1)).to.equal(true);
      expect(await claimModule.verify(user1.address, data2)).to.equal(false);

      // user2 owns mockNFT2 but not mockNFT
      expect(await claimModule.verify(user2.address, data1)).to.equal(false);
      expect(await claimModule.verify(user2.address, data2)).to.equal(true);
    });
  });
});
