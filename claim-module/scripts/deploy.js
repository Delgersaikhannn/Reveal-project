const { ethers } = require("hardhat");

async function main() {
  const [deployer, registryMock] = await ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const deploy = async (name, args = []) => {
    const factory = await ethers.getContractFactory(name, deployer);
    const contract = await factory.deploy(...args);
    await contract.waitForDeployment();
    const address = await contract.getAddress();
    console.log(`${name}:`, address);
    return contract;
  };

  await deploy("ERC721ClaimModule");
  await deploy("ERC20DAOClaimModule");

  const registryAddress = registryMock?.address || deployer.address;
  await deploy("MyDAORegistryAdapter", [registryAddress]);
  await deploy("WalletAgeClaimModule");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
