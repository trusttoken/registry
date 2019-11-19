pragma solidity ^0.5.13;

contract ForceEther {
    constructor() public payable { }

    function destroyAndSend(address payable _recipient) public {
        selfdestruct(_recipient);
    }
}
