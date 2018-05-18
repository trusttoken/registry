pragma solidity ^0.4.23;

import "../Registry.sol";
import "../RegistryAccessManager.sol";

contract RegistryAccessManagerMock is RegistryAccessManager {
    function confirmWrite(address /*_who*/, string /*_attribute*/, uint256 /*_value*/, string /*_notes*/, address /*_admin*/) public returns (bool) {
        return true;
    }
}