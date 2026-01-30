// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IClaimModule.sol";

/**
 * @dev Example DAO-specific registry interface
 */
interface IMyDAORegistry {
    function isActiveMember(address user) external view returns (bool);
}

/**
 * @notice Claim: caller is an active member according to this DAO's registry
 * @dev Adapter is intentionally per-DAO to keep trust assumptions explicit
 */
contract MyDAORegistryAdapter is IClaimModule {
    address public immutable registry;

    constructor(address _registry) {
        registry = _registry;
    }

    function verify(address user, bytes calldata) external view override returns (bool) {
        return IMyDAORegistry(registry).isActiveMember(user);
    }
}
