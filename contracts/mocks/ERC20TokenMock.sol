pragma solidity ^0.4.23;
import "openzeppelin-solidity/contracts/token/ERC20/StandardToken.sol";

contract MockToken is StandardToken {
  constructor(address _initialAccount, uint256 _initialBalance ) public {
    totalSupply_ = _initialBalance;
    balances[_initialAccount] = _initialBalance;
  }
}