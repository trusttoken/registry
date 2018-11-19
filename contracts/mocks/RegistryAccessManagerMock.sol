pragma solidity ^0.4.23;

import "../RegistryAccessManager.sol";

contract RegistryAccessManagerMock is RegistryAccessManager {
    function confirmWrite(address _who, bytes32 _attribute, uint256 _value, bytes32 _notes, address _admin) public returns (bool) {
        return true;
    }
}
