pragma solidity ^0.4.23;
import "../Registry.sol";

contract RegistryMock is Registry {

    function initialize() public {
        require(!initialized, "already initialized");
        owner = msg.sender;
        initialized = true;
    }

}
