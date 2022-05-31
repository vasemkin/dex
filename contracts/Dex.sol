pragma solidity ^0.8.4;
// SPDX-License-Identifier: MIT
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract DEX {
    IERC20 private token;
    IERC20 private uniToken;
    uint256 public lockedLiquidity;
    mapping(address => uint256) public liquidity;

    constructor(address _token, address _uniToken) {
        token = IERC20(_token);
        uniToken = IERC20(_uniToken);
    }

    function initialize(uint256 _tokenAmount) public payable returns (uint256) {
        require(lockedLiquidity == 0, "DEX already initialized.");
        require(token.balanceOf(msg.sender) >= _tokenAmount, "Token balance not sufficient.");
        require(token.balanceOf(msg.sender) >= _tokenAmount, "UniToken balance not sufficient.");
        require(
            token.allowance(msg.sender, address(this)) >= _tokenAmount,
            "Token allowance too low."
        );
        require(
            uniToken.allowance(msg.sender, address(this)) >= _tokenAmount,
            "UniToken allowance too low."
        );
        lockedLiquidity = _tokenAmount;
        liquidity[msg.sender] = lockedLiquidity;
        require(
            token.transferFrom(msg.sender, address(this), _tokenAmount),
            "Error transferring tokens"
        );
        require(
            uniToken.transferFrom(msg.sender, address(this), _tokenAmount),
            "Error transferring tokens"
        );
        return lockedLiquidity;
    }

    function swap(
        uint256 _tokenAmount,
        address _fromToken,
        address _toToken
    ) public returns (uint256) {
        IERC20 fromToken = IERC20(_fromToken);
        IERC20 toToken = IERC20(_toToken);

        uint256 fromReserve = fromToken.balanceOf(address(this));
        uint256 toReserve = toToken.balanceOf(address(this));

        uint256 tokensBought = price(_tokenAmount, fromReserve - _tokenAmount, toReserve);
        require(toToken.transfer(msg.sender, tokensBought), "Error transferring the token");
        require(
            fromToken.transferFrom(msg.sender, address(this), _tokenAmount),
            "Error tranferring the token."
        );

        return tokensBought;
    }

    function price(
        uint256 _inputAmount,
        uint256 _inputReserve,
        uint256 _outputReserve
    ) public pure returns (uint256) {
        uint256 amountWithFee = _inputAmount * 997;
        uint256 numerator = amountWithFee * _outputReserve;
        uint256 denominator = _inputReserve * 1000 + amountWithFee;
        return numerator / denominator;
    }

    function estimateTokenAmount(
        uint256 _tokenAmount,
        address _fromToken,
        address _toToken
    ) public view returns (uint256) {
        IERC20 fromToken = IERC20(_fromToken);
        IERC20 toToken = IERC20(_toToken);

        uint256 fromReserve = fromToken.balanceOf(address(this));
        uint256 toReserve = toToken.balanceOf(address(this));

        return price(_tokenAmount, fromReserve - _tokenAmount, toReserve);
    }

    function estimateDeposit(
        uint256 _amount,
        address _baseToken,
        address _token
    ) public view returns (uint256) {
        IERC20 base = IERC20(_baseToken);
        IERC20 tok = IERC20(_token);
        uint256 baseReserve = base.balanceOf(address(this));
        uint256 tokReserve = tok.balanceOf(address(this));

        return ((_amount * tokReserve) / baseReserve) + 1;
    }

    function deposit(
        uint256 _amount,
        address _baseToken,
        address _token
    ) public returns (uint256) {
        IERC20 base = IERC20(_baseToken);
        IERC20 tok = IERC20(_token);
        uint256 baseReserve = base.balanceOf(address(this));
        uint256 tokReserve = tok.balanceOf(address(this));

        uint256 tokenAmount = ((_amount * tokReserve) / baseReserve) + 1;
        uint256 liquidityMinted = (_amount * lockedLiquidity) / baseReserve;

        liquidity[msg.sender] += liquidityMinted;
        lockedLiquidity += liquidityMinted;

        require(base.transferFrom(msg.sender, address(this), _amount), "Base token transfer Error");
        require(tok.transferFrom(msg.sender, address(this), tokenAmount), "Token transfer Error");

        return liquidityMinted;
    }

    function withdraw(
        uint256 _amount,
        address _baseToken,
        address _token
    ) public returns (uint256, uint256) {
        IERC20 base = IERC20(_baseToken);
        IERC20 tok = IERC20(_token);

        uint256 baseReserve = base.balanceOf(address(this));
        uint256 tokReserve = tok.balanceOf(address(this));

        uint256 baseAmount = (_amount * baseReserve) / lockedLiquidity;
        uint256 tokAmount = (_amount * tokReserve) / lockedLiquidity;

        liquidity[msg.sender] -= _amount;
        lockedLiquidity -= _amount;

        require(base.transfer(msg.sender, baseAmount), "Base token transfer Error");
        require(tok.transfer(msg.sender, tokAmount), "Token transfer Error");

        return (baseAmount, tokAmount);
    }
}
