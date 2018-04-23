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

### RegistryAccessManager.sol

Interface for contracts that determine who is allowed to set which attributes in the Registry.

### DefaultRegistryAccessManager.sol

Initial implementation of a RegistryAccessManager. Allows the owner to
set all attributes, and also allows the owner to choose other
users that can set specific attributes.

### HasRegistry.sol

Extended by other contracts that want to have a registry that is
replacable by the owner.

## Validation Token

### ValidationToken.sol

This implements the ERC20 interface so that it is easy for users to
interact with it from their standard wallets, but the point of it is
not actually to be a cryptocurrency but rather to allow users that
transfer its tokens to prove that they own their account (and can
transfer tokens from it).