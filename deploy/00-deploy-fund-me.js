const { network } = require('hardhat');
const {
  developmentChains,
  DECIMALS,
  INITIAL_ANSWER,
} = require('../helper-hardhat-config');

module.exports = async ({ getNameAccounts, deployments }) => {
  const { deploy, log } = deployments;
  const { deployer } = await getNameAccounts();
  const chainId = network.config.chainId;

  if (developmentChains.includes(chainId)) {
    log('Local network detected, deploying Mocks!');
    await deploy('MockV3Aggregator', {
      contract: 'MockV3Aggregator',
      from: deployer,
      log: true,
      args: [DECIMALS, INITIAL_ANSWER],
    });
    log('Mocks deployed');
    log('=================================================');
  }
};
