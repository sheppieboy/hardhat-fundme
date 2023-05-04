const { assert, expect } = require('chai');
const { deployments, ethers, getNamedAccounts } = require('hardhat');
describe('FundMe', async function () {
  let fundMe;
  let MockV3Aggregator;
  const sendValue = ethers.utils.parseEther('1.0');
  beforeEach(async () => {
    const { deployer } = getNamedAccounts();
    await deployments.fixture(['all']);
    fundMe = await ethers.getContract('FundMe', deployer);
    MockV3Aggregator = await ethers.getContract('MockV3Aggregator', deployer);
  });

  //constructor tests
  describe('constructor', async () => {
    it('sets the aggregator addresses correctly', async () => {
      const response = await fundMe.priceFeed();
      assert.equal(response, MockV3Aggregator.address);
    });
  });

  //fund
  describe('fund', async () => {
    it("Fails if you don't send enough eth", async () => {
      await expect(fundMe.fund()).to.be.revertedWith(
        'you need to spend more eth'
      );
    });

    it('updates the amount funded data structure', async () => {
      await fundMe.fund({ value: sendValue });
      const response = await fundMe.addressToAmountFunded(deployer);
      assert.equal(response.toString(), sendValue.toString());
    });

    it('Adds funder to array of funder', async () => {
      await fundMe.fund({ value: sendValue });
      const funder = await fundMe.funders[0];
      assert.equal(funder, deployer);
    });
  });
  //withdraw
  describe(async () => {
    beforeEach(async () => {
      await fundMe.fund({ value: sendValue });
    });

    it('withdraw Eth froma single founder', async () => {
      //Arrange
      const startingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const startingDeployerBalance = await fundMe.provider.getBalance(
        deployer
      );
      //Act
      const transactionResponse = await fundMe.withdraw();
      const transactionReceipt = await transactionResponse.wait(1);
      const endingFundMeBalance = await fundMe.provider.getBalance(
        fundMe.address
      );
      const endingDeployerBalance = await fundMe.provider.getBalance(deployer);

      const { gasUsed, effectiveGasPrice } = transactionReceipt;
      const gasCost = gasUsed.mul(effectiveGasPrice);

      //Assert
      assert.equal(endingFundMeBalance, 0);
      assert.equal(
        startingFundMeBalance.add(startingDeployerBalance).toString(),
        endingDeployerBalance.add(gasCost).toString()
      );
    });

    it('Allows withdrawal of multiple funders', async () => {
      const accounts = await ethers.getSigners();
      for (let i = 1; i < 6; i++) {
        const fundMeConnectContract = await fundMe.connect(accounts[i]);
        fundMeConnectContract.fund({ value: sendValue });
        //Arrange
        const startingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );
        const startingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        );

        //Act
        const transactionResponse = await fundMe.withdraw();
        const transactionReceipt = await transactionResponse.wait(1);
        const endingFundMeBalance = await fundMe.provider.getBalance(
          fundMe.address
        );
        const endingDeployerBalance = await fundMe.provider.getBalance(
          deployer
        );

        const { gasUsed, effectiveGasPrice } = transactionReceipt;
        const gasCost = gasUsed.mul(effectiveGasPrice);

        //Assert
        assert.equal(endingFundMeBalance, 0);
        assert.equal(
          startingFundMeBalance.add(startingDeployerBalance).toString(),
          endingDeployerBalance.add(gasCost).toString()
        );

        //make sure funders are reset properly
        await expect(fundMe.funders(0)).to.be.reverted();

        for (i = 1; i < 6; i++) {
          assert.equal(
            await fundMe.addressToAmountFunded(accounts[i].address),
            0
          );
        }
      }
    });

    it('Only allows the owner to withdraw', async () => {
      const accounts = await ethers.getSigners();
      const attacker = accounts[1];
      const attackerConnectContract = await fundMe.copnnect(attacker);

      await expect(attackerConnectContract.withdraw()).to.be.revertedWith(
        'FundMe__NotOwner'
      );
    });
  });
});
