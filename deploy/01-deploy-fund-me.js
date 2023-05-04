const {
  networkConfig,
  developmentChains,
} = require('../helper-hardhat-config');
const { network } = require('hardhat');
const { verify } = require('../utils/verify');

module.exports = async ({ getNameAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNameAccounts();
  const chainId = network.config.chainId;

  let ethUSDPriceFeedAddress;

  if (developmentChains.includes(network.name)) {
    const ethUSDAggregator = await deployments.get('MockV3Aggregator');
    ethUSDPriceFeedAddress = ethUSDAggregator.address;
  } else {
    ethUSDPriceFeedAddress = networkConfig[chainId]['ethUSDPriceFeed'];
  }

  //if contract doesn't exist, we deploi a min version for our local network

  //When using a localhost or hardhat network we want to use a mock
  const args = [ethUSDPriceFeedAddress];
  const fundMe = await deploy('FundMe', {
    from: deployer,
    args: args, // put price feed address
    log: true,
  });

  if (
    !developmentChains.includes(network.name) &&
    process.env.ETHERSCAN_API_KEY
  ) {
    await verify(fundMe.address, args);
  }
  log('-----------------------------------------');
};
module.exports.tags = ['all', 'fundme'];
