#!/usr/bin/env python3
# Copyright 2025 Samuel Olwe
# See LICENSE file for licensing details.

"""Flask Charm entrypoint."""

import logging
import typing

import ops
import paas_charm.flask

logger = logging.getLogger(__name__)

VERSION = "1.7.0"


class CsCanonicalComCharm(paas_charm.flask.Charm):
    """Flask Charm service."""

    def __init__(self, *args: typing.Any) -> None:
        """Initialize the instance.

        Args:
            args: passthrough to CharmBase.
        """
        super().__init__(*args)

    def _on_pebble_ready(self, event: ops.PebbleReadyEvent):
        # This is where you configure and start services
        # ... set up your Pebble Layer ...
        self._set_app_version()

    def _on_update_status(self, event):
        # Ensure the version is updated
        # if the charm is upgraded or config changes
        self._set_app_version()

    def _set_app_version(self):
        """Helper method to set the application version."""
        # This logic should be placed in a helper function
        self.unit.set_workload_version(VERSION)


if __name__ == "__main__":
    ops.main(CsCanonicalComCharm)
