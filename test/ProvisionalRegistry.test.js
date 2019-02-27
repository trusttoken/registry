import assertRevert from './helpers/assertRevert'
const RegistryMock = artifacts.require('ProvisionalRegistryMock')
const MockToken = artifacts.require("MockToken")
const ForceEther = artifacts.require("ForceEther")
const RegistryTokenMock = artifacts.require('RegistryTokenMock')

const BN = web3.utils.toBN;
const writeAttributeFor = require('./helpers/writeAttributeFor.js')
const bytes32 = require('./helpers/bytes32.js')

contract('ProvisionalRegistry', function ([_, owner, oneHundred, anotherAccount]) {
    const prop1 = web3.utils.sha3("foo")
    const IS_BLACKLISTED = bytes32('isBlacklisted');
    const IS_REGISTERED_CONTRACT = bytes32('isRegisteredContract');
    const IS_DEPOSIT_ADDRESS = bytes32('isDepositAddress');
    const HAS_PASSED_KYC_AML = bytes32("hasPassedKYC/AML");
    const CAN_BURN = bytes32("canBurn");
    const prop2 = bytes32("bar")
    const notes = bytes32("blarg")
    
    beforeEach(async function () {
        this.registry = await RegistryMock.new({ from: owner })
        await this.registry.initialize({ from: owner })
        this.registryToken = await RegistryTokenMock.new({ from: owner })
        await this.registryToken.setRegistry(this.registry.address, { from: owner })
        await this.registry.setClone(this.registryToken.address);
    })

    describe('sync', function() {
        beforeEach(async function() {
            await this.registry.setAttributeValue(oneHundred, prop1, 3, { from: owner });
        })
        it('writes sync', async function() {
            assert.equal(3, await this.registryToken.getAttributeValue(oneHundred, prop1));
        })
        it('syncs prior writes', async function() {
            let token2 = await RegistryTokenMock.new({ from: owner });
            await token2.setRegistry(this.registry.address, { from: owner });
            await this.registry.setClone(token2.address);
            assert.equal(3, await this.registryToken.getAttributeValue(oneHundred, prop1));
            assert.equal(0, await token2.getAttributeValue(oneHundred, prop1));

            await this.registry.syncAttributes([oneHundred], [prop1]);
            assert.equal(3, await token2.getAttributeValue(oneHundred, prop1));
        })
        it('syncs multiple prior writes', async function() {

            await this.registry.setAttributeValue(oneHundred, prop2, 4, { from: owner});
            await this.registry.setAttributeValue(anotherAccount, prop2, 5, { from: owner});
            await this.registry.setAttributeValue(owner, CAN_BURN, 6, { from: owner});
            let token2 = await RegistryTokenMock.new({ from: owner });
            await token2.setRegistry(this.registry.address, { from: owner });
            await this.registry.setClone(token2.address);
            assert.equal(3, await this.registryToken.getAttributeValue(oneHundred, prop1));
            assert.equal(0, await token2.getAttributeValue(oneHundred, prop1));

            await this.registry.syncAttributes([oneHundred, oneHundred, anotherAccount, owner], [prop1, prop2, prop2, CAN_BURN]);
            assert.equal(3, await token2.getAttributeValue(oneHundred, prop1));
            assert.equal(4, await token2.getAttributeValue(oneHundred, prop2));
            assert.equal(5, await token2.getAttributeValue(anotherAccount, prop2));
            assert.equal(6, await token2.getAttributeValue(owner, CAN_BURN));
        })
    })


})
