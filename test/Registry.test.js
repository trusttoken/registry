import assertRevert from './helpers/assertRevert'
const Registry = artifacts.require('Registry')
const MockToken = artifacts.require("MockToken")
const ForceEther = artifacts.require("ForceEther")
const BN = require('bn.js')

contract('Registry', function ([_, owner, oneHundred, anotherAccount]) {
    const prop1 = web3.sha3("foo")
    const IS_BLACKLISTED = 'isBlacklisted';
    const IS_REGISTERED_CONTRACT = 'isRegisteredContract';
    const IS_DEPOSIT_ADDRESS = 'isDepositAddress';
    const HAS_PASSED_KYC_AML = "hasPassedKYC/AML";
    const CAN_BURN = "canBurn";
    const prop2 = "bar"
    const notes = "blarg"
    
    beforeEach(async function () {
        this.registry = await Registry.new({ from: owner })
        await this.registry.initialize({ from: owner })
    })

    describe('ownership functions', async function(){
        it('cannot be reinitialized', async function () {
            await assertRevert(this.registry.initialize({ from: owner }))
        })
        it('can transfer ownership', async function () {
            await this.registry.transferOwnership(anotherAccount,{ from: owner })
            assert.equal(await this.registry.pendingOwner(),anotherAccount)
        })
        it('non owner cannot transfer ownership', async function () {
            await assertRevert(this.registry.transferOwnership(anotherAccount,{ from: anotherAccount }))
        })
        it('can claim ownership', async function () {
            await this.registry.transferOwnership(anotherAccount,{ from: owner })
            await this.registry.claimOwnership({ from: anotherAccount })
            assert.equal(await this.registry.owner(),anotherAccount)
        })
        it('only pending owner can claim ownership', async function () {
            await this.registry.transferOwnership(anotherAccount,{ from: owner })
            await assertRevert(this.registry.claimOwnership({ from: oneHundred }))
        })
    })
    describe('read/write', function () {
        it('works for owner', async function () {
            const { receipt } = await this.registry.setAttribute(anotherAccount, prop1, 3, notes, { from: owner })
            const attr = await this.registry.getAttribute(anotherAccount, prop1)
            assert.equal(attr[0], 3)
            assert.equal(web3.toUtf8(attr[1]), notes)
            assert.equal(attr[2], owner)
            assert.equal(attr[3], web3.eth.getBlock(receipt.blockNumber).timestamp)
            const hasAttr = await this.registry.hasAttribute(anotherAccount, prop1)
            assert.equal(hasAttr, true)
            const value = await this.registry.getAttributeValue(anotherAccount, prop1)
            assert.equal(Number(value),3)
            const adminAddress = await this.registry.getAttributeAdminAddr(anotherAccount, prop1)
            assert.equal(adminAddress, owner)
            const timestamp = await this.registry.getAttributeTimestamp(anotherAccount, prop1)
            assert.equal(timestamp,web3.eth.getBlock(receipt.blockNumber).timestamp)
        })

        it('sets only desired attribute', async function () {
            const { receipt } = await this.registry.setAttribute(anotherAccount, prop1, 3, notes, { from: owner })
            const attr = await this.registry.getAttribute(anotherAccount, prop2)
            assert.equal(attr[0], 0)
            assert.equal(attr[1], '0x0000000000000000000000000000000000000000000000000000000000000000')
            assert.equal(attr[2], 0)
            const hasAttr = await this.registry.hasAttribute(anotherAccount, prop2)
            assert.equal(hasAttr, false)
        })

        it('emits an event', async function () {
            const { logs } = await this.registry.setAttribute(anotherAccount, prop1, 3, notes, { from: owner })

            assert.equal(logs.length, 1)
            assert.equal(logs[0].event, 'SetAttribute')
            assert.equal(logs[0].args.who, anotherAccount)
            assert.equal(logs[0].args.attribute, prop1)
            assert.equal(logs[0].args.value, 3)
            assert.equal(web3.toUtf8(logs[0].args.notes), notes)
            assert.equal(logs[0].args.adminAddr, owner)
        })

        it('cannot be called by random non-owner', async function () {
            await assertRevert(this.registry.setAttribute(anotherAccount, prop1, 3, notes, { from: oneHundred }))
        })

        it('owner can let others write', async function () {
            const canWriteProp1 = await this.registry.writeAttributeFor(prop1);
            await this.registry.setAttribute(oneHundred, canWriteProp1, 3, notes, { from: owner })
            await this.registry.setAttribute(anotherAccount, prop1, 3, notes, { from: oneHundred })
        })

        it('owner can let others write attribute value', async function () {
            const canWriteProp1 = await this.registry.writeAttributeFor(prop1);
            await this.registry.setAttributeValue(oneHundred, canWriteProp1, 3, { from: owner })
            await this.registry.setAttributeValue(anotherAccount, prop1, 3, { from: oneHundred })
        })

        it('others can only write what they are allowed to', async function () {
            const canWriteProp1 = await this.registry.writeAttributeFor(prop1);
            await this.registry.setAttribute(oneHundred, canWriteProp1, 3, notes, { from: owner })
            await assertRevert(this.registry.setAttribute(anotherAccount, prop2, 3, notes, { from: oneHundred }))
            await assertRevert(this.registry.setAttributeValue(anotherAccount, prop2, 3, { from: oneHundred }))
        })
    })

    describe('Attribute get Combination', async function(){
        const attr1 = "foo"
        const attr2 = "bar"
        const attr3 = "blarg"
        
        it('has both attributes', async function(){
            await this.registry.setAttribute(oneHundred, attr1, 1, notes, { from: owner })
            await this.registry.setAttribute(oneHundred, attr2, 1, notes, { from: owner })
            const result = await this.registry.hasBothAttributes(oneHundred, attr1, attr2)
            assert.equal(result,true)
        })

        it('does not have both attributes', async function(){
            await this.registry.setAttribute(oneHundred, attr1, 1, notes, { from: owner })
            await this.registry.setAttribute(oneHundred, attr2, 1, notes, { from: owner })
            const result = await this.registry.hasBothAttributes(oneHundred, attr1, attr3)
            assert.equal(result,false)
        })

        it('has either attributes',async function(){
            await this.registry.setAttribute(oneHundred, attr3, 1, notes, { from: owner })
            const result = await this.registry.hasEitherAttribute(oneHundred, attr1, attr3)
            assert.equal(result,true)
        })

        it('has neither attributes',async function(){
            const result = await this.registry.hasEitherAttribute(oneHundred, attr1, attr3)
            assert.equal(result,false)
        })

        it('either have attributes',async function(){
            await this.registry.setAttribute(oneHundred, attr1, 1, notes, { from: owner })
            const result = await this.registry.eitherHaveAttribute(oneHundred, anotherAccount, attr1)
            assert.equal(result,true)
        })

        it('neither have attributes',async function(){
            const result = await this.registry.eitherHaveAttribute(oneHundred, anotherAccount, attr3)
            assert.equal(result,false)
        })

        it('has one but not the other',async function(){
            await this.registry.setAttribute(oneHundred, attr1, 1, notes, { from: owner })
            let result = await this.registry.hasAttribute1ButNotAttribute2(oneHundred, attr1, attr3)
            assert.equal(result,true)
            await this.registry.setAttribute(oneHundred, attr3, 1, notes, { from: owner })
            result = await this.registry.hasAttribute1ButNotAttribute2(oneHundred, attr1, attr3)
            assert.equal(result,false)
        })

        it('both have Attribute', async function(){
            await this.registry.setAttribute(oneHundred, attr1, 1, notes, { from: owner })
            await this.registry.setAttribute(anotherAccount, attr1, 1, notes, { from: owner })
            const result = await this.registry.bothHaveAttribute(oneHundred, anotherAccount, attr1)
            assert.equal(result,true)
        })

        it ('have attributes', async function(){
            await this.registry.setAttribute(oneHundred, attr1, 1, notes, { from: owner })
            await this.registry.setAttribute(anotherAccount, attr3, 1, notes, { from: owner })
            const result = await this.registry.haveAttributes(oneHundred, attr1, anotherAccount, attr3)
            assert.equal(result,true)
        })

        it ('have either attributes', async function(){
            await this.registry.setAttribute(oneHundred, attr1, 1, notes, { from: owner })
            const result = await this.registry.haveEitherAttribute(anotherAccount, attr3, oneHundred, attr1)
            assert.equal(result,true)
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
            const isDepositAddressBefore = await this.registry.isDepositAddress(anotherAccount);
            assert.equal(isDepositAddressBefore, false);
            await this.registry.setAttributeValue(anotherAccount.slice(0, -5), IS_DEPOSIT_ADDRESS, anotherAccount, { from: owner });
            const isDepositAddressAfter = await this.registry.isDepositAddress(anotherAccount);
            assert.equal(isDepositAddressAfter, true);
            const depositAddress = await this.registry.getDepositAddress(anotherAccount);
            assert.equal(depositAddress, anotherAccount);
            const depositAddress0 = await this.registry.getDepositAddress(anotherAccount.slice(0, -5) + '00000');
            assert.equal(depositAddress0, anotherAccount);
            const result = await this.registry.requireCanTransfer(oneHundred, anotherAccount.slice(0, -5) + '00000');
            assert.equal(result[0], anotherAccount);
            assert.equal(result[1], false);
            const resultFrom = await this.registry.requireCanTransferFrom(oneHundred, oneHundred, anotherAccount.slice(0, -5) + 'fffff');
            assert.equal(resultFrom[0], anotherAccount);
            assert.equal(resultFrom[1], false);
            await this.registry.setAttributeValue(anotherAccount, IS_BLACKLISTED, 1, { from: owner });
            await assertRevert(this.registry.requireCanTransfer(oneHundred, anotherAccount.slice(0, -5) + 'eeeee'));
            await assertRevert(this.registry.requireCanTransferFrom(oneHundred, oneHundred, anotherAccount.slice(0, -5) + 'eeeee'));
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
            await this.registry.setAttributeValue(anotherAccount.slice(0, -5), IS_DEPOSIT_ADDRESS, anotherAccount, { from: owner });
            await this.registry.setAttributeValue(anotherAccount, IS_REGISTERED_CONTRACT, anotherAccount, { from: owner });
            const resultContract = await this.registry.requireCanTransfer(oneHundred, anotherAccount.slice(0, -5) + '00000');
            assert.equal(resultContract[0], anotherAccount);
            assert.equal(resultContract[1], true);
            const resultFromContract = await this.registry.requireCanTransferFrom(oneHundred, oneHundred, anotherAccount.slice(0, -5) + 'fffff');
            assert.equal(resultFromContract[0], anotherAccount);
            assert.equal(resultFromContract[1], true);
            await this.registry.setAttributeValue(anotherAccount, IS_BLACKLISTED, 1, { from: owner });
            await assertRevert(this.registry.requireCanTransfer(oneHundred, anotherAccount.slice(0, -5) + 'eeeee'));
            await assertRevert(this.registry.requireCanTransferFrom(oneHundred, oneHundred, anotherAccount.slice(0, -5) + 'eeeee'));
        });
    })

    describe('requireCanMint', async function() {
        it('reverts without KYCAML flag', async function() {
            assertRevert(this.registry.requireCanMint(owner));
            assertRevert(this.registry.requireCanMint(oneHundred));
            assertRevert(this.registry.requireCanMint(anotherAccount));
        })
        it('reverts for blacklisted recipient', async function() {
            await this.registry.setAttributeValue(anotherAccount, HAS_PASSED_KYC_AML, 1, { from: owner });
            await this.registry.setAttributeValue(anotherAccount, IS_BLACKLISTED, 1, { from: owner });
            assertRevert(this.registry.requireCanMint(anotherAccount));
        })
        it('returns false for whitelisted accounts', async function() {
            await this.registry.setAttributeValue(anotherAccount, HAS_PASSED_KYC_AML, 1, { from: owner });
            const result = await this.registry.requireCanMint(anotherAccount);
            assert.equal(result[0], anotherAccount);
            assert.equal(result[1], false);
        })
        it('returns deposit address', async function() {
            const depositAddress = anotherAccount.slice(0, -5) + '00055';
            await this.registry.setAttributeValue(depositAddress, HAS_PASSED_KYC_AML, 1, { from: owner });
            await this.registry.setAttributeValue(anotherAccount.slice(0, -5), IS_DEPOSIT_ADDRESS, anotherAccount, { from: owner });
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
            const depositAddress = anotherAccount.slice(0, -5) + '00055';
            await this.registry.setAttributeValue(depositAddress, HAS_PASSED_KYC_AML, 1, { from: owner });
            await this.registry.setAttributeValue(anotherAccount, IS_REGISTERED_CONTRACT, 1, { from: owner });
            await this.registry.setAttributeValue(anotherAccount.slice(0, -5), IS_DEPOSIT_ADDRESS, anotherAccount, { from: owner });
            const result = await this.registry.requireCanMint(depositAddress);
            assert.equal(result[0], anotherAccount);
            assert.equal(result[1], true);
        })
    })

    describe('requireCanBurn', async function() {
        it('reverts without CAN_BURN flag', async function() {
            assertRevert(this.registry.requireCanBurn(owner));
            assertRevert(this.registry.requireCanBurn(oneHundred));
            assertRevert(this.registry.requireCanBurn(anotherAccount));
        })
        it('works with CAN_BURN flag', async function () {
            await this.registry.setAttributeValue(anotherAccount, CAN_BURN, 1, { from: owner });
            await this.registry.requireCanBurn(anotherAccount);
            assertRevert(this.registry.requireCanBurn(owner));
        })
        it('reverts for blacklisted accounts', async function() {
            await this.registry.setAttributeValue(anotherAccount, CAN_BURN, 1, { from: owner });
            await this.registry.setAttributeValue(anotherAccount, IS_BLACKLISTED, 1, { from: owner });
            assertRevert(this.registry.requireCanBurn(anotherAccount));
            assertRevert(this.registry.requireCanBurn(owner));
        })
    })

    describe('no ether and no tokens', function () {
        beforeEach(async function () {
            this.token = await MockToken.new( this.registry.address, 100, { from: owner })
        })

        it ('owner can transfer out token in the contract address ',async function(){
            await this.registry.reclaimToken(this.token.address, owner, { from: owner })
        })

        it('cannot transfer ether to contract address',async function(){
            await assertRevert(this.registry.sendTransaction({ 
                value: 33, 
                from: owner, 
                gas: 300000 
             }));         
        })

        it ('owner can transfer out ether in the contract address',async function(){
            const emptyAddress = "0x5fef93e79a73b28a9113a618aabf84f2956eb3ba"
            const emptyAddressBalance = web3.fromWei(web3.eth.getBalance(emptyAddress), 'ether').toNumber()

            const forceEther = await ForceEther.new({ from: owner, value: "10000000000000000000" })
            await forceEther.destroyAndSend(this.registry.address, { from: owner })
            const registryInitialWithForcedEther = web3.fromWei(web3.eth.getBalance(this.registry.address), 'ether').toNumber()
            await this.registry.reclaimEther(emptyAddress, { from: owner })
            const registryFinalBalance = web3.fromWei(web3.eth.getBalance(this.registry.address), 'ether').toNumber()
            const emptyAddressFinalBalance = web3.fromWei(web3.eth.getBalance(emptyAddress), 'ether').toNumber()
            assert.equal(registryInitialWithForcedEther,10)
            assert.equal(registryFinalBalance,0)
            assert.equal(emptyAddressFinalBalance,10)
        })

    })
})
