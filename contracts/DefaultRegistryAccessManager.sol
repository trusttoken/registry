pragma solidity ^0.4.23;

import "./Registry.sol";
import "./RegistryAccessManager.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract DefaultRegistryAccessManager is RegistryAccessManager {
    using SafeMath for uint256;

    string public constant WRITE_PERMISSION = "canWriteTo-";

    // Allows a write if either a) the writer is that Registry's owner, or
    // b) the writer is writing to attribute foo and that writer already has
    // the canWriteTo-foo attribute set (in that same Registry)
    function confirmWrite(address /*_who*/, string _attribute, uint256 /*_value*/, string /*_notes*/, address _admin) public returns (bool) {
        Registry client = Registry(msg.sender);
        return (_admin == client.owner() || client.hasAttribute(_admin, strConcat(WRITE_PERMISSION, _attribute)));
    }

    // Based on https://github.com/oraclize/ethereum-api/blob/master/oraclizeAPI_0.5.sol#L830
    function strConcat(string _x, string _y) internal pure returns (string) {
        bytes memory bx = bytes(_x);
        bytes memory by = bytes(_y);
        string memory xy = new string(bx.length.add(by.length));
        bytes memory bxy = bytes(xy);
        uint k = 0;
        for (uint i = 0; i < bx.length; i++) bxy[k++] = bx[i];
        for (i = 0; i < by.length; i++) bxy[k++] = by[i];
        return string(bxy);
    }
}