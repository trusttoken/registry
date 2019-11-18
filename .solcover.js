module.exports = {
    client: require('ganache-cli'),
    testCommand: 'node --max-old-space-size=4096 ../node_modules/.bin/truffle test --network coverage',
    compileCommand: 'node --max-old-space-size=4096 ../node_modules/.bin/truffle compile --network coverage',
    skipFiles: ['Migrations.sol', 'mocks'],
    copyPackages: ['openzeppelin-solidity'],
    providerOptions: {
        "hardfork": "istanbul"
    }
}
