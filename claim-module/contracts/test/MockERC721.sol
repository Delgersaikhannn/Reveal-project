// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @notice Mock ERC721 for testing claim modules
 */
contract MockERC721 {
    string public name;
    string public symbol;

    mapping(uint256 => address) private _owners;
    mapping(address => uint256) private _balances;

    constructor(string memory _name, string memory _symbol) {
        name = _name;
        symbol = _symbol;
    }

    function balanceOf(address owner) external view returns (uint256) {
        return _balances[owner];
    }

    function ownerOf(uint256 tokenId) external view returns (address) {
        return _owners[tokenId];
    }

    function mint(address to, uint256 tokenId) external {
        require(_owners[tokenId] == address(0), "Token already minted");
        _owners[tokenId] = to;
        _balances[to]++;
    }

    function transferFrom(address from, address to, uint256 tokenId) external {
        require(_owners[tokenId] == from, "Not owner");
        _owners[tokenId] = to;
        _balances[from]--;
        _balances[to]++;
    }
}
