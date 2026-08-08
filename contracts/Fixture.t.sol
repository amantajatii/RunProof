// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {Fixture} from "./Fixture.sol";

/// The fixture is the ground truth every RunProof verdict is measured against.
/// If `increment()` were to succeed while paused, a `silent-failure` verdict
/// would be RunProof's bug, not KeeperHub's.
contract FixtureTest is Test {
    Fixture private fixture;

    function setUp() public {
        fixture = new Fixture();
    }

    function test_startsAtZeroAndUnpaused() public view {
        assertEq(fixture.count(), 0);
        assertEq(fixture.paused(), false);
    }

    function test_incrementRaisesCountByExactlyOne() public {
        fixture.increment();
        assertEq(fixture.count(), 1);
        fixture.increment();
        assertEq(fixture.count(), 2);
    }

    function test_incrementRevertsWhilePaused() public {
        fixture.setPaused(true);
        vm.expectRevert(bytes("paused"));
        fixture.increment();
    }

    /// The revert must leave no trace — a partial state change would make the
    /// "nothing happened" half of the silent-failure scenario a lie.
    function test_revertLeavesCountUntouched() public {
        fixture.increment();
        fixture.setPaused(true);
        vm.expectRevert(bytes("paused"));
        fixture.increment();
        assertEq(fixture.count(), 1);
    }

    function test_unpausingRestoresIncrement() public {
        fixture.setPaused(true);
        fixture.setPaused(false);
        fixture.increment();
        assertEq(fixture.count(), 1);
    }

    function testFuzz_countTracksCallCount(uint8 n) public {
        for (uint256 i = 0; i < n; i++) {
            fixture.increment();
        }
        assertEq(fixture.count(), n);
    }
}
