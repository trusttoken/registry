pragma solidity ^0.5.13;
import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor(address _initialAccount, uint256 _initialBalance ) public {
        _mint(_initialAccount, _initialBalance);
    }
}
