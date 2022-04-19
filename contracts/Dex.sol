pragma solidity ^0.8.4;
// SPDX-License-Identifier: MIT
// import "hardhat/console.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DEX {
    IERC20 private token;
    uint256 public lockedLiquidity;
    mapping(address => uint256) public liquidity;

    constructor(address _token) {
        token = IERC20(_token);
    }

    function initialize(uint256 _tokenAmount) public payable returns (uint256) {
        require(lockedLiquidity == 0, "DEX already initialized.");
        require(token.balanceOf(msg.sender) >= _tokenAmount, "Token balance not sufficient.");
        require(token.allowance(msg.sender, address(this)) >= _tokenAmount, "Token allowance not sufficient.");
        lockedLiquidity = address(this).balance;
        liquidity[msg.sender] = lockedLiquidity;
        token.transferFrom(msg.sender, address(this), _tokenAmount);
        return lockedLiquidity;
    }

    function price(
        uint256 _inputAmount,
        uint256 _inputReserve,
        uint256 _outputReserve
    ) public pure returns (uint256) {
        uint256 amountWithFeee = _inputAmount * 997;
        uint256 numerator = amountWithFeee * _outputReserve;
        uint256 denominator = _inputReserve * 1000 + amountWithFeee;
        return numerator / denominator;
    }

    function ethToToken() public payable returns (uint256) {
        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 tokensBought = price(msg.value, address(this).balance - msg.value, tokenReserve);
        require(token.transfer(msg.sender, tokensBought));
        return tokensBought;
    }

    function tokenToEth(uint256 tokens) public returns (uint256) {
        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 ethBought = price(tokens, tokenReserve, address(this).balance);
        (bool sent, ) = msg.sender.call{value: ethBought}("");
        require(sent, "Failed to send user eth.");
        require(token.transferFrom(msg.sender, address(this), tokens));
        return ethBought;
    }

    function deposit() public payable returns (uint256) {
        uint256 ethReserve = address(this).balance - msg.value;
        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 tokenAmount = ((msg.value * tokenReserve) / ethReserve) + 1;
        uint256 liquidityMinted = (msg.value * lockedLiquidity) / ethReserve;
        liquidity[msg.sender] += liquidityMinted;
        lockedLiquidity += liquidityMinted;
        require(token.transferFrom(msg.sender, address(this), tokenAmount));
        return liquidityMinted;
    }

    function withdraw(uint256 _liquidityAmount) public returns (uint256, uint256) {
        uint256 tokenReserve = token.balanceOf(address(this));
        uint256 ethAmount = (_liquidityAmount * address(this).balance) / lockedLiquidity;
        uint256 tokenAmount = (_liquidityAmount * tokenReserve) / lockedLiquidity;
        liquidity[msg.sender] -= _liquidityAmount;
        lockedLiquidity -= _liquidityAmount;
        (bool sent, ) = msg.sender.call{value: ethAmount}("");
        require(sent, "Failed to send user eth.");
        require(token.transfer(msg.sender, tokenAmount));
        return (ethAmount, tokenAmount);
    }
}
