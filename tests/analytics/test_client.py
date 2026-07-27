"""Tests for analytics opt-in behavior and its local side effects."""

from __future__ import annotations

from pathlib import Path

from openjarvis.analytics.client import AnalyticsClient
from openjarvis.core.config import AnalyticsConfig


def test_disabled_client_does_not_create_identity(tmp_path: Path, monkeypatch) -> None:
    anon_id_path = tmp_path / "anon_id"
    initialized = False

    def _mark_initialized(_client: AnalyticsClient) -> None:
        nonlocal initialized
        initialized = True

    monkeypatch.setattr(AnalyticsClient, "_init_sdk", _mark_initialized)

    client = AnalyticsClient(
        AnalyticsConfig(enabled=False, anon_id_path=str(anon_id_path))
    )

    assert client.enabled is False
    assert client.anon_id == ""
    assert initialized is False
    assert not anon_id_path.exists()


def test_enabled_client_creates_identity_and_initializes_sdk(
    tmp_path: Path, monkeypatch
) -> None:
    anon_id_path = tmp_path / "anon_id"
    initialized = False

    def _mark_initialized(client: AnalyticsClient) -> None:
        nonlocal initialized
        initialized = True
        client._posthog = object()

    monkeypatch.setattr(AnalyticsClient, "_init_sdk", _mark_initialized)

    client = AnalyticsClient(
        AnalyticsConfig(enabled=True, anon_id_path=str(anon_id_path))
    )

    assert client.enabled is True
    assert client.anon_id
    assert initialized is True
    assert anon_id_path.exists()
