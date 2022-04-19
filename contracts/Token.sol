pragma solidity ^0.8.4;
// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Balloons is ERC20 {
    constructor() ERC20("Token", "TOK") {
        _mint(msg.sender, 100000 ether);
    }
}
