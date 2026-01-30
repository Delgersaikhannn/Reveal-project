// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "./IClaimModule.sol";

interface IERC721 {
    function balanceOf(address owner) external view returns (uint256);
}

/**
 * @notice Claim: caller owns at least one token of the given ERC721 contract
 */
contract ERC721ClaimModule is IClaimModule {
    function verify(address user, bytes calldata data) external view override returns (bool) {
        address nftContract = abi.decode(data, (address));
        return IERC721(nftContract).balanceOf(user) > 0;
    }
}
