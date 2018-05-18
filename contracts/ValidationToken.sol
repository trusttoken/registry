pragma solidity ^0.4.23;

import "openzeppelin-solidity/contracts/token/ERC20/ERC20.sol";
import "openzeppelin-solidity/contracts/math/SafeMath.sol";

// The goal of this token is to allow users to prove that they
// 1) own their ethereum account
// 2) can use that account to trade ERC20 tokens
// To that end, *every* address initially starts out with 10000 tokens,
// and this contract supports transfer but not transferFrom. A simpler contract
// that does not track balances at all could serve this purpose, but this
// contract may be less confusing to users (and/or smart wallets) since it behaves
// rather like a normal ERC20 token.
contract ValidationToken is ERC20 {
    string public name = "Validation Token";
    string public symbol = "VTKN";
    uint8 public decimals = 18;

    using SafeMath for uint256;

    uint256 public constant INITIAL_BALANCE = 10000;
    address public FAUCET = 0x01;

    // Addresses that have never yet sent or received tokens will not appear
    // in either of these mappings, and will be treated as having 10000 tokens.
    mapping(address => uint256) balances;
    // Addresses are added to this mapping once their balance is being tracked.
    // This allows addresses that have spent all their tokens (i.e. actual balance
    // of 0) to be distinguished from addresses that still have their initial 10000.
    mapping(address => bool) initializations;

    // returns the maximum uint256 because we can't return 'infinity'
    function totalSupply() public view returns (uint256) {
        return 2**256 - 1;
    }

    // A normal transfer function, except that if you send to 0x01 (with
    // any _value), instead of transfering it will mint you 10000 new coins.
    // The standard protection against transferring to 0x0 is omitted because
    // these tokens are worthless so who cares.
    function transfer(address _to, uint256 _value) public returns (bool) {
        if (_to == FAUCET) {
            moreFreeCoins(msg.sender);
            return true;
        }

        uint256 fromBalance = balanceOf(msg.sender);
        require(_value <= fromBalance);
        uint256 toBalance = balanceOf(_to);

        balances[msg.sender] = fromBalance.sub(_value);
        balances[_to] = toBalance.add(_value);
        emit Transfer(msg.sender, _to, _value);

        markInitialized(msg.sender);
        markInitialized(_to);

        return true;
    }

    // Mint 10000 new coins for _to. This is for the convenience of anyone who
    // accidentally (or through repeated validations) runs out of
    // tokens.
    function moreFreeCoins(address _to) internal {
        uint256 toBalance = balanceOf(_to);

        balances[_to] = toBalance.add(INITIAL_BALANCE);
        emit Transfer(FAUCET, _to, INITIAL_BALANCE);

        markInitialized(_to);
    }

    function markInitialized(address _addr) internal {
        if (!initializations[_addr]) {
            initializations[_addr] = true;
        }
    }

    function balanceOf(address _owner) public view returns (uint256) {
        bool initialized = initializations[_owner];
        uint256 balance;
        if (initialized) {
            balance = balances[_owner];
        } else {
            balance = INITIAL_BALANCE;
        }
        return balance;
    }

    function transferFrom(address, address, uint256) public returns (bool) {
        return false;
    }

    function approve(address, uint256) public returns (bool) {
        return false;
    }

    function allowance(address, address) public view returns (uint256) {
        return 0;
    }
}