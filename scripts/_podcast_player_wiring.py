#!/usr/bin/env python3

"""Shared PodcastPlayer wiring for the website podcast pipeline.

Single source of truth for the on-page player ``<script setup>`` block and the
``<PodcastPlayer>`` component tag. Both the page generator
(``sync-podcast-lesson-pages.py``) and the LLM post-build renderer
(``render-podcast-player-llms.py``) import these so the emitted tag and the tag
the renderer searches for can never drift.
"""

from __future__ import annotations

import re

HEADER_IMPORT = "import PodcastEpisodeHeader from '@theme/components/PodcastEpisodeHeader.vue'"
PLAYER_IMPORT = "import PodcastPlayer from '@theme/components/PodcastPlayer.vue'"

# The episode header carries its learning point as slot text (not an attribute),
# so it survives accents/quotes without escaping. The generator emits the
# open/close pair; HEADER_BLOCK_RE lets the LLM post-renderer find the whole
# block and capture the slot without parsing Vue attributes.
HEADER_OPEN = '<PodcastEpisodeHeader :episode="cues.episode">'
HEADER_CLOSE = "</PodcastEpisodeHeader>"
HEADER_BLOCK_RE = re.compile(
    r"<PodcastEpisodeHeader\b[^>]*?>(?P<lede>.*?)</PodcastEpisodeHeader>", re.DOTALL
)
COMPONENT_TAG = '<PodcastPlayer :episode="cues.episode" :sections="cues.sections" />'


def script_setup_block(cues_filename: str) -> str:
    """Return the page ``<script setup>`` block importing the header, player and cues."""
    return (
        "<script setup>\n"
        f"{HEADER_IMPORT}\n"
        f"{PLAYER_IMPORT}\n"
        f"import cues from './{cues_filename}'\n"
        "</script>"
    )
