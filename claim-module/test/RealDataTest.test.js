const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Real Data Verification Tests", function () {
  let claimModule;

  // Real addresses provided by user (will use lowercase to avoid checksum issues)
  const NFT_ADDRESS = "0xd5babab921a9167abbf7f093fd6969a86ea4eaa8";
  const ERC20_TOKEN_ADDRESS = "0xefb6217dd067c5c8e036286975abf1d681be2dfd";
  const WALLET_ADDRESS = "0xb931e339b4f5eb3d4d039ce1451426754063c711";

  // Deployed claim modules on Sepolia testnet (freshly deployed)
  const DEPLOYED_ERC721_MODULE = "0x5867eaF2a28034124bC05583EB6Ee20323e01EE3";
  const DEPLOYED_ERC20DAO_MODULE = "0xAc93B403c21e9c2fdfFdD760e85efaFaf532Aedf";

  before(async function () {
    console.log("\n🔍 Testing with Real Data on Sepolia:");
    console.log("NFT Contract:", NFT_ADDRESS);
    console.log("ERC20 Contract:", ERC20_TOKEN_ADDRESS);
    console.log("Wallet:", WALLET_ADDRESS);
    console.log("ERC721ClaimModule:", DEPLOYED_ERC721_MODULE);
    console.log("ERC20DAOClaimModule:", DEPLOYED_ERC20DAO_MODULE);
  });

  describe("ERC721 Real NFT Ownership Check", function () {
    it("Should check if wallet owns NFTs from the real contract", async function () {
      // Connect to deployed claim module
      claimModule = await ethers.getContractAt(
        "ERC721ClaimModule",
        DEPLOYED_ERC721_MODULE,
      );

      // Encode the NFT contract address
      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address"],
        [NFT_ADDRESS],
      );

      // Check NFT balance directly
      const nftContract = await ethers.getContractAt("IERC721", NFT_ADDRESS);

      let balance;
      try {
        balance = await nftContract.balanceOf(WALLET_ADDRESS);
        console.log(`\n📊 NFT Balance: ${balance.toString()}`);
      } catch (error) {
        console.log(`\n⚠️ Could not fetch NFT balance: ${error.message}`);
        console.log(
          "The contract might not support balanceOf or might not exist on this network",
        );
      }

      // Verify using claim module
      try {
        const result = await claimModule.verify(WALLET_ADDRESS, data);
        console.log(`✅ Claim Module Result: ${result}`);

        if (balance !== undefined) {
          const expectedResult = balance > 0n;
          expect(result).to.equal(expectedResult);
          console.log(
            `✓ Result matches expected value (balance > 0: ${expectedResult})`,
          );
        }
      } catch (error) {
        console.log(`\n❌ Verification failed: ${error.message}`);
        throw error;
      }
    });
  });

  describe("ERC20 Real Token Balance Check", function () {
    it("Should check wallet's ERC20 token balance", async function () {
      const erc20Contract = await ethers.getContractAt(
        "IERC20",
        ERC20_TOKEN_ADDRESS,
      );

      try {
        const balance = await erc20Contract.balanceOf(WALLET_ADDRESS);
        console.log(
          `\n💰 ERC20 Token Balance: ${ethers.formatEther(balance)} tokens`,
        );
        console.log(`   Raw Balance: ${balance.toString()}`);
      } catch (error) {
        console.log(`\n⚠️ Could not fetch ERC20 balance: ${error.message}`);
        console.log("The contract might not exist on this network");
      }
    });

    it("Should verify ERC20 balance using ERC20DAOClaimModule", async function () {
      const claimModule = await ethers.getContractAt(
        "ERC20DAOClaimModule",
        DEPLOYED_ERC20DAO_MODULE,
      );

      // Encode the ERC20 contract address and minimum balance (e.g., 100 tokens)
      const minBalance = ethers.parseEther("100");
      const data = ethers.AbiCoder.defaultAbiCoder().encode(
        ["address", "uint256"],
        [ERC20_TOKEN_ADDRESS, minBalance],
      );

      try {
        const result = await claimModule.verify(WALLET_ADDRESS, data);
        console.log(`\n✅ ERC20DAO Claim Module Result: ${result}`);
        console.log(
          `   (Checking if balance >= ${ethers.formatEther(minBalance)} tokens)`,
        );

        const erc20Contract = await ethers.getContractAt(
          "IERC20",
          ERC20_TOKEN_ADDRESS,
        );
        const actualBalance = await erc20Contract.balanceOf(WALLET_ADDRESS);
        const expectedResult = actualBalance >= minBalance;

        expect(result).to.equal(expectedResult);
        console.log(
          `✓ Result matches: wallet has ${ethers.formatEther(actualBalance)} tokens`,
        );
      } catch (error) {
        console.log(`\n❌ ERC20DAO Verification failed: ${error.message}`);
        throw error;
      }
    });
  });

  describe("Wallet Information", function () {
    it("Should display wallet information", async function () {
      const provider = ethers.provider;

      try {
        const balance = await provider.getBalance(WALLET_ADDRESS);
        console.log(
          `\n👛 Wallet Native Balance: ${ethers.formatEther(balance)} APE`,
        );

        const code = await provider.getCode(WALLET_ADDRESS);
        const isContract = code !== "0x";
        console.log(`   Is Contract: ${isContract}`);

        const txCount = await provider.getTransactionCount(WALLET_ADDRESS);
        console.log(`   Transaction Count: ${txCount}`);
      } catch (error) {
        console.log(`\n⚠️ Could not fetch wallet info: ${error.message}`);
      }
    });
  });
});
