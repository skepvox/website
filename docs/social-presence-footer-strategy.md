# Social Presence and Footer Link Strategy

> **Deferred strategy.** This document records the social/distribution presence to revisit when skepvox
> builds an owned global footer and owned social-link/icon components. It is not an implementation
> slice. Do not add links or icons from this document through `@vue/theme` socialLinks unless the
> icon, label, and accessible name are correct.
>
> **Roadmap placement:** implement this after the `/pt/literatura/` Brás Cubas pipeline rebuild, the
> consolidation / simplification / test-protocol pass, and the **brand asset system** pass. The brand
> pass should settle favicon/search preview/Apple touch/manifest/OG/JSON-LD logo assets first, so the
> social/footer icon layer does not invent a second visual language. The first footer implementation
> pieces should then be owned social-link data, an owned `SocialIcon` seam, `SocialLinks`, and finally
> the owned footer.

## 1. Product Fit

skepvox is not a generic media brand. The social surface should feel quiet, literary, and durable:
reading app, translations, language podcasts, and long-form learning. The site should not expose a
large strip of social icons just because platforms exist.

The correct model is:

- **Website = canonical home.** Books, podcast pages, RSS, and future reading-app surfaces live here.
- **RSS / email = owned audience.** These should matter more than any rented social network.
- **Social platforms = distribution and discovery.** Use them to bring people back to the site, not to
  replace the site.

## 2. Recommended Primary Presence

### YouTube

Primary cross-region channel for:

- podcast video or audio companions;
- short excerpts from episodes;
- reading notes and book explainers;
- translation-process clips;
- longer lectures or conversations later.

It is the safest broad platform across South America, North America, and Europe.

### Instagram

Primary visual/social layer for:

- literary excerpts;
- short reels from podcasts or reading notes;
- book passages;
- translation/process behind-the-scenes;
- launch announcements.

This is the most natural public social presence for the current skepvox tone. The current
`@vue/theme` `socialLinks` limitation is already noted in `.vitepress/config.ts`: it cannot render a
correct Instagram icon + accessible label, so Instagram should wait for an owned social component.

### Spotify, Apple Podcasts, and RSS

These are essential for podcast distribution, even though they are not "social" in the ordinary
sense. Podcast pages should prioritize:

- Spotify;
- Apple Podcasts;
- RSS;
- optionally YouTube when episode video/audio companion content exists.

RSS should stay visible because it matches the open-web identity of the project.

### WhatsApp Channel

Recommended especially for Brazil and South America.

Start with a **Channel**, not a group:

- broadcast new books, new segments, podcast releases, and major reading-app updates;
- avoid moderation burden;
- keep it low-noise and announcement-oriented.

### Newsletter / Email

Not social media, but strategically one of the most important links.

Email should be treated as a durable audience layer:

- monthly or occasional reading/podcast digest;
- new book/edition announcements;
- translation/reflection notes;
- no high-frequency marketing cadence.

## 3. Secondary Presence

### TikTok / YouTube Shorts

Useful only if short-form production becomes consistent. Good for discovery, but it can pull the
project toward a noisier tone. Keep optional until there is a clear repeatable format.

### LinkedIn

Useful for the professional/intellectual side:

- AI + humanities;
- translation workflow;
- reading app/product notes;
- language-learning method;
- essays about the corpus.

More credibility channel than casual discovery channel.

### Reddit

Do not make it a primary website icon. Use selectively and conversationally in communities around
books, philosophy, language learning, French, Portuguese, and translation. Link only if there is an
actual official community later.

## 4. Lower Priority / Avoid as Primary

- **Facebook:** still relevant in some age groups and regions, but it should not lead the visual
  footer unless there is a deliberate community/group strategy.
- **X:** not core for this project. Keep only if it remains a real active presence; otherwise remove
  from the owned footer when the new footer ships.
- **Bluesky / Mastodon:** optional open-web/intellectual presences, but not growth priorities.

## 5. Region Notes

### South America

Prioritize:

- WhatsApp Channel;
- Instagram;
- YouTube;
- Spotify;
- RSS/email for durable followers.

### North America

Prioritize:

- YouTube;
- Apple Podcasts;
- Spotify;
- Instagram;
- newsletter/email;
- selective Reddit participation.

### Europe

Prioritize:

- YouTube;
- Instagram;
- Spotify;
- RSS/newsletter;
- LinkedIn for professional/intellectual reach;
- WhatsApp where locally useful.

## 6. Future Footer Link Set

When the owned footer ships, the first visible set should be small:

1. YouTube
2. Instagram
3. WhatsApp
4. Newsletter
5. RSS

Podcast-specific pages can add:

1. Spotify
2. Apple Podcasts
3. RSS
4. YouTube, if relevant

A secondary "more" area can carry LinkedIn and any other active presence. Avoid more than five primary
icons in the global footer.

## 7. Icon and Accessibility Requirements

The future footer must use an owned social-link component, not the rented `@vue/theme` `socialLinks`
surface, unless the rented surface can provide correct icons and accessible labels.

This footer/icon work depends on the prior **brand asset system** slice. That slice owns the skepvox
mark used by Google Search favicon, mobile browser suggestion previews, Apple touch icons, manifest
icons, Open Graph/Twitter cards, and Organization JSON-LD logo. Footer social glyphs should align with
that settled mark and token vocabulary, not the other way around.

Requirements:

- correct brand glyph for each platform;
- visible or accessible text label for every link;
- `aria-label` must match the platform and action;
- external links should be obvious but quiet;
- focus ring must use the skepvox focus token;
- icons must not depend on a broad runtime icon library unless a later icon-system decision allows it;
- no wrong-glyph workaround, for example an unrelated icon pointing to Instagram.

## 8. Recheck Before Implementation

Social platform importance changes quickly. Before implementing the footer, recheck current data from:

- DataReportal global and country reports;
- Pew Research Center for North America;
- platform-specific podcast/distribution requirements;
- skepvox's actual active accounts and posting capacity.

The implementation should reflect real maintained presences, not aspirational accounts.
