pragma solidity ^0.4.23;

import "./Registry.sol";

// Interface for logic governing write access to a Registry.
contract RegistryAccessManager {
    // Called when _admin attempts to write _value for _who's _attribute.
    // Returns true if the write is allowed to proceed.
    function confirmWrite(address _who, string _attribute, uint256 _value, string _notes, address _admin) public returns (bool);
}