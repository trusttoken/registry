pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

import "./HasRegistry.sol";

contract RegistryToken is HasRegistry {
    mapping(address => mapping(bytes32 => uint256)) attributes;
    
    modifier onlyRegistry {
      require(msg.sender == address(registry));
      _;
    }

    function syncAttributeValue(address _who, bytes32 _attribute, uint256 _value) public onlyRegistry {
        attributes[_who][_attribute] = _value;
    }
}
