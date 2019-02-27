const ProvisionalRegistryMock = artifacts.require('ProvisionalRegistryMock')
const RegistryTokenMock = artifacts.require('RegistryTokenMock')

import assertRevert from './helpers/assertRevert'
const bytes32 = require('./helpers/bytes32.js')

contract('ProvisionalRegistry', function ([_, owner, oneHundred, anotherAccount]) {
    const prop1 = web3.utils.sha3("foo")
    const IS_BLACKLISTED = bytes32('isBlacklisted');
    const IS_REGISTERED_CONTRACT = bytes32('isRegisteredContract');
    const IS_DEPOSIT_ADDRESS = bytes32('isDepositAddress');
    const HAS_PASSED_KYC_AML = bytes32("hasPassedKYC/AML");
    const CAN_BURN = bytes32("canBurn");
    const prop2 = bytes32("bar")
    
    beforeEach(async function () {
        this.registry = await ProvisionalRegistryMock.new({ from: owner })
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

    describe('requireCanTransfer and requireCanTransferFrom', async function() {
        it('return _to and false when nothing set', async function() {
            const result = await this.registry.requireCanTransfer(oneHundred, anotherAccount);
            assert.equal(result[0], anotherAccount);
            assert.equal(result[1], false);
            const resultFrom = await this.registry.requireCanTransferFrom(owner, oneHundred, anotherAccount);
            assert.equal(resultFrom[0], anotherAccount);
            assert.equal(resultFrom[1], false);
        });
        it('revert when _from is blacklisted', async function() {
            await this.registry.setAttributeValue(oneHundred, IS_BLACKLISTED, 1, { from: owner });
            await assertRevert(this.registry.requireCanTransfer(oneHundred, anotherAccount));
            await assertRevert(this.registry.requireCanTransferFrom(owner, oneHundred, anotherAccount));
        });
        it('revert when _to is blacklisted', async function() {
            await this.registry.setAttributeValue(anotherAccount, IS_BLACKLISTED, 1, { from: owner });
            await assertRevert(this.registry.requireCanTransfer(oneHundred, anotherAccount));
            await assertRevert(this.registry.requireCanTransferFrom(owner, oneHundred, anotherAccount));
        });
        it('revert when _sender is blacklisted', async function() {
            await this.registry.setAttributeValue(anotherAccount, IS_BLACKLISTED, 1, { from: owner });
            await assertRevert(this.registry.requireCanTransferFrom(anotherAccount, oneHundred, owner));
        });
        it('handle deposit addresses', async function() {
            await this.registry.setAttributeValue(web3.utils.toChecksumAddress('0x00000' + anotherAccount.slice(2, -5)), IS_DEPOSIT_ADDRESS, anotherAccount, { from: owner });
            const result = await this.registry.requireCanTransfer(oneHundred, web3.utils.toChecksumAddress(anotherAccount.slice(0, -5) + '00000'));
            assert.equal(result[0], anotherAccount);
            assert.equal(result[1], false);
            const resultFrom = await this.registry.requireCanTransferFrom(oneHundred, oneHundred, web3.utils.toChecksumAddress(anotherAccount.slice(0, -5) + 'fffff'));
            assert.equal(resultFrom[0], anotherAccount);
            assert.equal(resultFrom[1], false);
            await this.registry.setAttributeValue(anotherAccount, IS_BLACKLISTED, 1, { from: owner });
            await assertRevert(this.registry.requireCanTransfer(oneHundred, web3.utils.toChecksumAddress(anotherAccount.slice(0, -5) + 'eeeee')));
            await assertRevert(this.registry.requireCanTransferFrom(oneHundred, oneHundred, web3.utils.toChecksumAddress(anotherAccount.slice(0, -5) + 'eeeee')));
        });
        it('return true when recipient is a registered contract', async function() {
            await this.registry.setAttributeValue(anotherAccount, IS_REGISTERED_CONTRACT, anotherAccount, { from: owner });
            const result = await this.registry.requireCanTransfer(oneHundred, anotherAccount);
            assert.equal(result[0], anotherAccount);
            assert.equal(result[1], true);
            const resultFrom = await this.registry.requireCanTransferFrom(owner, oneHundred, anotherAccount);
            assert.equal(resultFrom[0], anotherAccount);
            assert.equal(resultFrom[1], true);
        });
        it ('handles deposit addresses that are registered contracts', async function() {
            await this.registry.setAttributeValue(web3.utils.toChecksumAddress('0x00000' + anotherAccount.slice(2, -5)), IS_DEPOSIT_ADDRESS, anotherAccount, { from: owner });
            await this.registry.setAttributeValue(anotherAccount, IS_REGISTERED_CONTRACT, anotherAccount, { from: owner });
            const resultContract = await this.registry.requireCanTransfer(oneHundred, web3.utils.toChecksumAddress(anotherAccount.slice(0, -5) + '00000'));
            assert.equal(resultContract[0], anotherAccount);
            assert.equal(resultContract[1], true);
            const resultFromContract = await this.registry.requireCanTransferFrom(oneHundred, oneHundred, web3.utils.toChecksumAddress(anotherAccount.slice(0, -5) + 'fffff'));
            assert.equal(resultFromContract[0], anotherAccount);
            assert.equal(resultFromContract[1], true);
            await this.registry.setAttributeValue(anotherAccount, IS_BLACKLISTED, 1, { from: owner });
            await assertRevert(this.registry.requireCanTransfer(oneHundred, web3.utils.toChecksumAddress(anotherAccount.slice(0, -5) + 'eeeee')));
            await assertRevert(this.registry.requireCanTransferFrom(oneHundred, oneHundred, web3.utils.toChecksumAddress(anotherAccount.slice(0, -5) + 'eeeee')));
        });
    })

    describe('requireCanMint', async function() {
        it('reverts without KYCAML flag', async function() {
            await assertRevert(this.registry.requireCanMint(owner));
            await assertRevert(this.registry.requireCanMint(oneHundred));
            await assertRevert(this.registry.requireCanMint(anotherAccount));
        })
        it('reverts for blacklisted recipient', async function() {
            await this.registry.setAttributeValue(anotherAccount, HAS_PASSED_KYC_AML, 1, { from: owner });
            await this.registry.setAttributeValue(anotherAccount, IS_BLACKLISTED, 1, { from: owner });
            await assertRevert(this.registry.requireCanMint(anotherAccount));
        })
        it('returns false for whitelisted accounts', async function() {
            await this.registry.setAttributeValue(anotherAccount, HAS_PASSED_KYC_AML, 1, { from: owner });
            const result = await this.registry.requireCanMint(anotherAccount);
            assert.equal(result[0], anotherAccount);
            assert.equal(result[1], false);
        })
        it('returns deposit address', async function() {
            const depositAddress = web3.utils.toChecksumAddress(anotherAccount.slice(0, -5) + '00055');
            await this.registry.setAttributeValue(depositAddress, HAS_PASSED_KYC_AML, 1, { from: owner });
            await this.registry.setAttributeValue(web3.utils.toChecksumAddress('0x00000' + anotherAccount.slice(2, -5)), IS_DEPOSIT_ADDRESS, anotherAccount, { from: owner });
            const result = await this.registry.requireCanMint(depositAddress);
            assert.equal(result[0], anotherAccount);
            assert.equal(result[1], false);
        })
        it('returns true for registered', async function() {
            await this.registry.setAttributeValue(anotherAccount, HAS_PASSED_KYC_AML, 1, { from: owner });
            await this.registry.setAttributeValue(anotherAccount, IS_REGISTERED_CONTRACT, 1, { from: owner });
            const result = await this.registry.requireCanMint(anotherAccount);
            assert.equal(result[0], anotherAccount);
            assert.equal(result[1], true);
        })
        it('handles registered deposit addresses', async function() {
            const depositAddress = web3.utils.toChecksumAddress(anotherAccount.slice(0, -5) + '00055');
            await this.registry.setAttributeValue(depositAddress, HAS_PASSED_KYC_AML, 1, { from: owner });
            await this.registry.setAttributeValue(anotherAccount, IS_REGISTERED_CONTRACT, 1, { from: owner });
            await this.registry.setAttributeValue(web3.utils.toChecksumAddress('0x00000' + anotherAccount.slice(2, -5)), IS_DEPOSIT_ADDRESS, anotherAccount, { from: owner });
            const result = await this.registry.requireCanMint(depositAddress);
            assert.equal(result[0], anotherAccount);
            assert.equal(result[1], true);
        })
    })

    describe('requireCanBurn', async function() {
        it('reverts without CAN_BURN flag', async function() {
            await assertRevert(this.registry.requireCanBurn(owner));
            await assertRevert(this.registry.requireCanBurn(oneHundred));
            await assertRevert(this.registry.requireCanBurn(anotherAccount));
        })
        it('works with CAN_BURN flag', async function () {
            await this.registry.setAttributeValue(anotherAccount, CAN_BURN, 1, { from: owner });
            await this.registry.requireCanBurn(anotherAccount);
            await assertRevert(this.registry.requireCanBurn(owner));
        })
        it('reverts for blacklisted accounts', async function() {
            await this.registry.setAttributeValue(anotherAccount, CAN_BURN, 1, { from: owner });
            await this.registry.setAttributeValue(anotherAccount, IS_BLACKLISTED, 1, { from: owner });
            await assertRevert(this.registry.requireCanBurn(anotherAccount));
            await assertRevert(this.registry.requireCanBurn(owner));
        })
    })


})
