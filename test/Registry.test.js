import registryTests from './Registry'
const RegistryMock = artifacts.require('RegistryMock')
const RegistryTokenMock = artifacts.require('RegistryTokenMock')

contract ('Registry', function ([_, owner, oneHundred, anotherAccount]) {
    beforeEach(async function () {
        this.registry = await RegistryMock.new({ from: owner })
        await this.registry.initialize({ from: owner })
        this.registryToken = await RegistryTokenMock.new({ from: owner })
        await this.registryToken.setRegistry(this.registry.address, { from: owner })
        await this.registry.setClone(this.registryToken.address);
    })


    registryTests([owner, oneHundred, anotherAccount])
})
