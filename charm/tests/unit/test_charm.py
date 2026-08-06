# Copyright 2026 Canonical Ltd.
# See LICENSE file for licensing details.

"""Unit tests for the cs.canonical.com charm's custom functionality."""

import pathlib
import sys

CHARM_DIR = pathlib.Path(__file__).parents[2]
sys.path.insert(0, str(CHARM_DIR / "lib"))
sys.path.insert(0, str(CHARM_DIR / "src"))

from ops import testing  # noqa: E402

import charm  # noqa: E402


class TestWorkloadVersion:
    """Test workload version is set on appropriate events."""

    def test_pebble_ready_sets_version(self):
        """On pebble-ready, workload version is set to VERSION constant."""
        ctx = testing.Context(charm.CsCanonicalComCharm)
        container = testing.Container("flask-app", can_connect=True)
        state = testing.State(containers={container}, leader=True)

        state_out = ctx.run(ctx.on.pebble_ready(container), state)
        assert state_out.workload_version == charm.VERSION

    def test_update_status_sets_version(self):
        """On update-status, workload version is refreshed."""
        ctx = testing.Context(charm.CsCanonicalComCharm)
        container = testing.Container("flask-app", can_connect=True)
        state = testing.State(containers={container}, leader=True)

        state_out = ctx.run(ctx.on.update_status(), state)
        assert state_out.workload_version == charm.VERSION
