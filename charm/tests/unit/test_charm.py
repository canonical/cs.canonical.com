# Copyright 2026 Canonical Ltd.
# See LICENSE file for licensing details.

"""Unit tests for the cs.canonical.com charm's custom functionality.

Tests cover: workload version setting on pebble-ready and update-status.
"""

import os
import pathlib
import sys
import unittest.mock

import ops
import yaml

mock_paas = unittest.mock.MagicMock()
mock_paas.flask.Charm = ops.CharmBase
sys.modules["paas_charm"] = mock_paas
sys.modules["paas_charm.flask"] = mock_paas.flask

CHARM_DIR = pathlib.Path(__file__).parents[2]
sys.path.insert(0, str(CHARM_DIR / "src"))

os.environ["SCENARIO_SKIP_CONSISTENCY_CHECKS"] = "1"

import charm  # noqa: E402
import ops.testing  # noqa: E402

# Load and merge metadata for the test subclass.
_raw = yaml.safe_load((CHARM_DIR / "charmcraft.yaml").read_text())
_FLASK_EXT_META = {
    "assumes": ["k8s-api"],
    "containers": {"flask-app": {"resource": "flask-app-image"}},
    "peers": {"secret-storage": {"interface": "secret-storage"}},
    "provides": {
        "grafana-dashboard": {"interface": "grafana_dashboard"},
        "metrics-endpoint": {"interface": "prometheus_scrape"},
    },
    "requires": {
        "ingress": {"interface": "ingress", "limit": 1},
        "logging": {"interface": "loki_push_api"},
    },
    "resources": {
        "flask-app-image": {"description": "flask application image.", "type": "oci-image"}
    },
}
_META = {k: v for k, v in _raw.items() if k not in ("config", "actions", "extensions")}
for key, ext_value in _FLASK_EXT_META.items():
    if key not in _META:
        _META[key] = ext_value
    elif isinstance(ext_value, dict) and isinstance(_META[key], dict):
        merged = dict(ext_value)
        merged.update(_META[key])
        _META[key] = merged
_CONFIG = _raw.get("config")
_ACTIONS = _raw.get("actions")


class _TestCsCharm(charm.CsCanonicalComCharm):
    """Register observers that the real parent class would provide."""

    def __init__(self, *args):
        super().__init__(*args)
        self.framework.observe(
            self.on.flask_app_pebble_ready, self._on_pebble_ready
        )
        self.framework.observe(
            self.on.update_status, self._on_update_status
        )


class TestWorkloadVersion:
    """Test workload version is set on appropriate events."""

    def test_pebble_ready_sets_version(self):
        """On pebble-ready, workload version is set to VERSION constant."""
        ctx = ops.testing.Context(
            _TestCsCharm, meta=_META, config=_CONFIG, actions=_ACTIONS,
        )
        container = ops.testing.Container("flask-app", can_connect=True)
        state = ops.testing.State(containers={container}, leader=True)

        state_out = ctx.run(ctx.on.pebble_ready(container), state)
        assert state_out.workload_version == charm.VERSION

    def test_update_status_sets_version(self):
        """On update-status, workload version is refreshed."""
        ctx = ops.testing.Context(
            _TestCsCharm, meta=_META, config=_CONFIG, actions=_ACTIONS,
        )
        container = ops.testing.Container("flask-app", can_connect=True)
        state = ops.testing.State(containers={container}, leader=True)

        state_out = ctx.run(ctx.on.update_status(), state)
        assert state_out.workload_version == charm.VERSION

    def test_version_constant_is_correct(self):
        """VERSION constant has the expected value."""
        assert charm.VERSION == "1.8.1"
