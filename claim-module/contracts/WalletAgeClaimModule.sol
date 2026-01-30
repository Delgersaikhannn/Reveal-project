// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IClaimModule.sol";

/**
 * @notice Claim: wallet age in days is at least the provided threshold
 * @dev Off-chain systems supply the derived age; on-chain module is pure for hackathon-safety
 */
contract WalletAgeClaimModule is IClaimModule {
    function verify(address, bytes calldata data) external pure override returns (bool) {
        uint256 walletAgeDays = abi.decode(data, (uint256));
        return walletAgeDays >= 90;
    }
}
