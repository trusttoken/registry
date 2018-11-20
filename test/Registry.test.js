import assertRevert from './helpers/assertRevert'
const Registry = artifacts.require('Registry')
const RegistryAccessManagerMock = artifacts.require('RegistryAccessManagerMock')
const MockToken = artifacts.require("MockToken")
const ForceEther = artifacts.require("ForceEther")

contract('Registry', function ([_, owner, oneHundred, anotherAccount]) {
    const prop1 = web3.sha3("foo")
    const prop2 = "bar"
    const notes = "blarg"
    const canWriteProp1 = "0xb6e46a64b8cca9f5f4dcd34ff27fac5267998e4bde07acc0f7e58fcb9562959e"

    beforeEach(async function () {
        this.registry = await Registry.new({ from: owner })
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
            await this.registry.setAttribute(oneHundred, canWriteProp1, 3, notes, { from: owner })
            await this.registry.setAttribute(anotherAccount, prop1, 3, notes, { from: oneHundred })
        })

        it('others can only write what they are allowed to', async function () {
            await this.registry.setAttribute(oneHundred, canWriteProp1, 3, notes, { from: owner })
            await assertRevert(this.registry.setAttribute(anotherAccount, prop2, 3, notes, { from: oneHundred }))
        })
    })

    describe('set manager', function () {
        beforeEach(async function () {
            this.manager = await RegistryAccessManagerMock.new({ from: owner })
        })

        it('sets the manager', async function () {
            await this.registry.setManager(this.manager.address, { from: owner })

            let manager = await this.registry.accessManager()
            assert.equal(manager, this.manager.address)
        })

        it('emits an event', async function () {
            let oldManager = await this.registry.accessManager()
            const { logs } = await this.registry.setManager(this.manager.address, { from: owner })

            assert.equal(logs.length, 1)
            assert.equal(logs[0].event, 'SetManager')
            assert.equal(logs[0].args.oldManager, oldManager)
            assert.equal(logs[0].args.newManager, this.manager.address)
        })

        it('cannot be called by non-owner', async function () {
            await assertRevert(this.registry.setManager(this.manager.address, { from: anotherAccount }))
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
