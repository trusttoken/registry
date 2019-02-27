const ProvisionalRegistryMock = artifacts.require('ProvisionalRegistryMock')
const RegistryTokenMock = artifacts.require('RegistryTokenMock')

const bytes32 = require('./helpers/bytes32.js')

contract('ProvisionalRegistry', function ([_, owner, oneHundred, anotherAccount]) {
    const prop1 = web3.utils.sha3("foo")
    const CAN_BURN = bytes32("canBurn");
    const prop2 = bytes32("bar")
    
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
