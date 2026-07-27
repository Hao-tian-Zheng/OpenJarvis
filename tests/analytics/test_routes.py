"""Tests for the frontend-facing analytics identity endpoint."""

from __future__ import annotations

from pathlib import Path

import pytest

pytest.importorskip("fastapi")

from openjarvis.core.config import JarvisConfig  # noqa: E402
from openjarvis.server import analytics_routes  # noqa: E402


def test_default_identity_is_disabled_without_local_side_effects(
    tmp_path: Path, monkeypatch
) -> None:
    cfg = JarvisConfig()
    anon_id_path = tmp_path / "anon_id"
    cfg.analytics.anon_id_path = str(anon_id_path)
    monkeypatch.setattr(analytics_routes, "load_config", lambda: cfg)

    identity = analytics_routes.get_identity()

    assert identity.enabled is False
    assert identity.anon_id == ""
    assert identity.key == ""
    assert not anon_id_path.exists()
