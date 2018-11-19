pragma solidity ^0.4.23;

import "./Registry.sol";
import "./RegistryAccessManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract DefaultRegistryAccessManager is RegistryAccessManager {
    using SafeMath for uint256;

    bytes32 public constant WRITE_PERMISSION = keccak("canWriteTo-");

    // Allows a write if either a) the writer is that Registry's owner, or
    // b) the writer is writing to attribute foo and that writer already has
    // the canWriteTo-foo attribute set (in that same Registry)
    function confirmWrite(address /*_who*/, bytes32 _attribute, uint256 /*_value*/, bytes32 /*_notes*/, address _admin) public returns (bool) {
        Registry client = Registry(msg.sender);
        return (_admin == client.owner() || client.hasAttribute(_admin, WRITE_PERMISSION ^ _attribute));
    }
}
