import assertRevert from './helpers/assertRevert'
const Registry = artifacts.require('Registry')
const HasRegistry = artifacts.require('HasRegistry')

contract('HasRegistry', function ([_, owner, anotherAccount]) {
    beforeEach(async function () {
        this.token = await HasRegistry.new({ from: owner })
    })

    describe('--HasRegistry Tests--', function () {
        describe('setRegistry', function () {
            let registry2

            beforeEach(async function () {
                registry2 = await Registry.new({ from: owner })
            })

            it('sets the registry', async function () {
                await this.token.setRegistry(registry2.address, { from: owner })

                let registry = await this.token.registry()
                assert.equal(registry, registry2.address)
            })

            it('emits an event', async function () {
                const { logs } = await this.token.setRegistry(registry2.address, { from: owner })

                assert.equal(logs.length, 1)
                assert.equal(logs[0].event, 'SetRegistry')
                assert.equal(logs[0].args.registry, registry2.address)
            })

            it('cannot be called by non-owner', async function () {
                await assertRevert(this.token.setRegistry(registry2.address, { from: anotherAccount }))
            })
        })
    })
})