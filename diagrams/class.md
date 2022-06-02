```mermaid
classDiagram
    class DEX {
        - IERC20 tokenA
        - IERC20 tokenB
        + uint256 lockedLiquidity
        + mapping[adress=>uint256] liquidity
        + initialize()
        + swap()
        + deposit()
        + withdraw()
        + price()
        + estimateTokenAmount()
        + estimateDeposit()
        + estimateWithdraw
    }

    class TokenA {
        + bytes32 name
        + bytes32 symbol
        - _mint()
    }

    class TokenB {
        + bytes32 name
        + bytes32 symbol
        - _mint()
    }

    class ERC20 {
        + uint256 totalSuuply
        + transfer()
        + transferFrom()
        + approve()
        + allowance()
    }

    ERC20 <|-- TokenA
    ERC20 <|-- TokenB

    TokenA ..> DEX
    TokenB ..> DEX

```
