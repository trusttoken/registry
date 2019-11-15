pragma solidity ^0.5.13;
import "../Registry.sol";
import "../ProvisionalRegistry.sol";

contract RegistryMock is Registry {


    /**
    * @dev sets the original `owner` of the contract to the sender
    * at construction. Must then be reinitialized
    */
    constructor() public {
        owner = msg.sender;
        emit OwnershipTransferred(address(0), owner);
    }

    function initialize() public {
        require(!initialized, "already initialized");
        owner = msg.sender;
        initialized = true;
    }
}

contract ProvisionalRegistryMock is RegistryMock, ProvisionalRegistry {
}
