// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IClaimModule.sol";

interface IERC20 {
    function balanceOf(address owner) external view returns (uint256);
}

/**
 * @notice Claim: caller holds at least `minBalance` of the ERC20 token
 */
contract ERC20DAOClaimModule is IClaimModule {
    function verify(address user, bytes calldata data) external view override returns (bool) {
        (address token, uint256 minBalance) = abi.decode(data, (address, uint256));
        return IERC20(token).balanceOf(user) >= minBalance;
    }
}
