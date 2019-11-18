module.exports = {
    client: require('ganache-cli'),
    skipFiles: ['Migrations.sol', 'mocks'],
    providerOptions: {
        "hardfork": "istanbul"
    }
}
