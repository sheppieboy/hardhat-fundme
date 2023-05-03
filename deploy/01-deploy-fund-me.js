const { networkConfig } = require('../helper-hardhat-config');
const { network } = require('hardhat');

module.exports = async ({ getNameAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNameAccounts();
  const chainId = network.config.chainId;

  const ethUSDPriceFeed = networkConfig[chainId]['ethUSDPriceFeed'];

  //if contract doesn't exist, we deploi a min version for our local network

  //When using a localhost or hardhat network we want to use a mock
  const fundMe = await deploy('FundMe', {
    from: deployer,
    args: [], // put price feed address
    log: true,
  });
};
