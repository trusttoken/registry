# README.md

This repository contains contracts used for ensuring regulatory
compliance of cryptocurrencies. It takes inspiration from the
[Transaction Permission Layer project](https://github.com/TPL-protocol/tpl-contracts).
Here is a high-level overview of the contracts; for more detail
see the relevant .sol files.

## The Registry

### Registry.sol

Stores arbitrary attributes for users, such as whether they have
passed a KYC/AML check.
Allows the owner to set all attributes, and also allows the owner 
to choose other users that can set specific attributes.

### HasRegistry.sol

Extended by other contracts that want to have a registry that is
replacable by the owner.

## Testing

To run the tests and generate a code coverage report:
```bash
npm install
npm test
```
 
