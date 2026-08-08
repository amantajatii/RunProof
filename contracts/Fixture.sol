// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// Fixture untuk RunProof: satu jalur sukses, satu jalur revert.
contract Fixture {
    uint256 public count;
    bool public paused;

    function setPaused(bool p) external {
        paused = p;
    }

    function increment() external {
        require(!paused, "paused");
        count++;
    }
}
