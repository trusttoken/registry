pragma solidity ^0.5.13;

import "../RegistryToken.sol";

contract RegistryTokenMock is RegistryToken {

    function getAttributeValue(address _who, bytes32 _attribute) public view returns (uint256) {
        return attributes[_who][_attribute];
    }

}
