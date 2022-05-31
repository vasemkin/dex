pragma solidity ^0.8.4;
// SPDX-License-Identifier: MIT

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract UniToken is ERC20 {
    constructor() ERC20("UniToken", "UNI") {
        _mint(msg.sender, 100000 ether);
    }
}
