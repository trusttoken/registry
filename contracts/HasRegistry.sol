pragma solidity ^0.4.23;

import "./Registry.sol";

// Superclass for contracts that have a registry that can be set by their owners
contract HasRegistry is Ownable {
    Registry public registry;

    event SetRegistry(address indexed registry);

    function setRegistry(Registry _registry) onlyOwner public {
        registry = _registry;
        emit SetRegistry(registry);
    }
}
