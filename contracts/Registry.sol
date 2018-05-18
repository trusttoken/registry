pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/ownership/Claimable.sol";
import "./DefaultRegistryAccessManager.sol";
import "./RegistryAccessManager.sol";

contract Registry is Claimable {
    struct AttributeData {
        uint256 value;
        string notes;
        address adminAddr;
        uint256 timestamp;
    }

    // Stores arbitrary attributes for users. An example use case is an ERC20
    // token that requires its users to go through a KYC/AML check - in this case
    // a validator can set an account's "hasPassedKYC/AML" attribute to 1 to indicate
    // that account can use the token. This mapping stores that value (1, in the
    // example) as well as which validator last set the value and at what time,
    // so that e.g. the check can be renewed at appropriate intervals.
    mapping(address => mapping(string => AttributeData)) private attributes;
    // The logic governing who is allowed to set what attributes is abstracted as
    // this accessManager, so that it may be replaced by the owner as needed
    RegistryAccessManager public accessManager;

    constructor() public {
        accessManager = new DefaultRegistryAccessManager();
    }

    event SetAttribute(address indexed who, string attribute, uint256 value, string notes, address indexed adminAddr);
    event SetManager(address indexed oldManager, address indexed newManager);

    // Writes are allowed only if the accessManager approves
    function setAttribute(address _who, string _attribute, uint256 _value, string _notes) public {
        require(accessManager.confirmWrite(_who, _attribute, _value, _notes, msg.sender));
        attributes[_who][_attribute] = AttributeData(_value, _notes, msg.sender, block.timestamp);
        emit SetAttribute(_who, _attribute, _value, _notes, msg.sender);
    }

    // Returns true if the uint256 value stored for this attribute is non-zero
    function hasAttribute(address _who, string _attribute) public view returns (bool) {
        return attributes[_who][_attribute].value != 0;
    }

    // Returns the exact value of the attribute, as well as its metadata
    function getAttribute(address _who, string _attribute) public view returns (uint256, string, address, uint256) {
        AttributeData memory data = attributes[_who][_attribute];
        return (data.value, data.notes, data.adminAddr, data.timestamp);
    }

    function setManager(RegistryAccessManager _accessManager) public onlyOwner {
        emit SetManager(accessManager, _accessManager);
        accessManager = _accessManager;
    }
}