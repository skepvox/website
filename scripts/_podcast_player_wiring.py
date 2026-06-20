#!/usr/bin/env python3

"""Shared PodcastPlayer wiring for the website podcast pipeline.

Single source of truth for the on-page player ``<script setup>`` block and the
``<PodcastPlayer>`` component tag. Both the page generator
(``sync-podcast-lesson-pages.py``) and the LLM post-build renderer
(``render-podcast-player-llms.py``) import these so the emitted tag and the tag
the renderer searches for can never drift.
"""

from __future__ import annotations

PLAYER_IMPORT = "import PodcastPlayer from '@theme/components/PodcastPlayer.vue'"
COMPONENT_TAG = '<PodcastPlayer :episode="cues.episode" :sections="cues.sections" />'


def script_setup_block(cues_filename: str) -> str:
    """Return the page ``<script setup>`` block importing the player and cues."""
    return (
        "<script setup>\n"
        f"{PLAYER_IMPORT}\n"
        f"import cues from './{cues_filename}'\n"
        "</script>"
    )
