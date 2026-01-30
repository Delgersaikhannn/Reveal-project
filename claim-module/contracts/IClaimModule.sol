// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title IClaimModule
 * @notice Interface for selective disclosure claim verifiers
 */
interface IClaimModule {
    /**
     * @notice Verifies whether a user satisfies a claim
     * @param user Wallet address making the claim
     * @param data ABI-encoded claim parameters (module-specific schema)
     */
    function verify(address user, bytes calldata data) external view returns (bool);
}
