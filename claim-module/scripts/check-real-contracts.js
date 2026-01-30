const { ethers } = require("hardhat");

async function main() {
  const NFT_ADDRESS = "0xd5babab921a9167abbf7f093fd6969a86ea4eaa8";
  const ERC20_ADDRESS = "0xefb6217dd067c5c8e036286975abf1d681be2dfd";
  const WALLET_ADDRESS = "0xb931e339b4f5eb3d4d039ce1451426754063c711";

  console.log("\n🔍 Checking contracts on current network...");
  console.log("Network:", (await ethers.provider.getNetwork()).name);
  console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);

  // Check NFT contract
  console.log("\n📦 NFT Contract:", NFT_ADDRESS);
  const nftCode = await ethers.provider.getCode(NFT_ADDRESS);
  console.log("   Has code:", nftCode !== "0x", `(${nftCode.length} bytes)`);

  if (nftCode !== "0x") {
    try {
      const nftContract = await ethers.getContractAt("IERC721", NFT_ADDRESS);
      const balance = await nftContract.balanceOf(WALLET_ADDRESS);
      console.log("   ✅ Wallet NFT balance:", balance.toString());
    } catch (error) {
      console.log("   ❌ Error calling balanceOf:", error.message);
      
      // Try to call other common NFT functions
      console.log("\n   Trying other function signatures...");
      try {
        const abi = [
          "function name() view returns (string)",
          "function symbol() view returns (string)",
          "function totalSupply() view returns (uint256)",
          "function ownerOf(uint256 tokenId) view returns (address)",
        ];
        const contract = new ethers.Contract(NFT_ADDRESS, abi, ethers.provider);
        
        try {
          const name = await contract.name();
          console.log("   ✅ Name:", name);
        } catch (e) {
          console.log("   ❌ name() failed");
        }
        
        try {
          const symbol = await contract.symbol();
          console.log("   ✅ Symbol:", symbol);
        } catch (e) {
          console.log("   ❌ symbol() failed");
        }
        
        try {
          const totalSupply = await contract.totalSupply();
          console.log("   ✅ Total Supply:", totalSupply.toString());
        } catch (e) {
          console.log("   ❌ totalSupply() failed");
        }
        
        try {
          const owner = await contract.ownerOf(0);
          console.log("   ✅ Owner of token 0:", owner);
        } catch (e) {
          console.log("   ℹ️  ownerOf(0) failed (token might not exist)");
        }
      } catch (probeError) {
        console.log("   Could not probe contract functions");
      }
    }
  }

  // Check ERC20 contract
  console.log("\n💰 ERC20 Contract:", ERC20_ADDRESS);
  const erc20Code = await ethers.provider.getCode(ERC20_ADDRESS);
  console.log("   Has code:", erc20Code !== "0x", `(${erc20Code.length} bytes)`);

  if (erc20Code !== "0x") {
    try {
      const erc20Contract = await ethers.getContractAt("IERC20", ERC20_ADDRESS);
      const balance = await erc20Contract.balanceOf(WALLET_ADDRESS);
      console.log("   ✅ Wallet token balance:", ethers.formatEther(balance));
    } catch (error) {
      console.log("   ❌ Error calling balanceOf:", error.message);
    }
  }

  // Check wallet
  console.log("\n👛 Wallet:", WALLET_ADDRESS);
  const walletBalance = await ethers.provider.getBalance(WALLET_ADDRESS);
  console.log("   Native balance:", ethers.formatEther(walletBalance));
  const txCount = await ethers.provider.getTransactionCount(WALLET_ADDRESS);
  console.log("   Transaction count:", txCount);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
