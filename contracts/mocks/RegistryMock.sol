pragma solidity ^0.4.23;
import "../Registry.sol";

contract RegistryMock is Registry {

    RegistryClone _clone;

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

    function setClone(RegistryClone __clone) public {
        _clone = __clone;
    }

    function clone() internal view returns (RegistryClone) {
        return _clone;
    }
}
