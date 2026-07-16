# Phase 2 Backlog

Date: 2026-07-16

## Purpose

The MVP is a static kaidan library. The features below require backend storage, authentication, moderation, paid-service integration, or operational review, so they are intentionally not implemented now.

## Candidate Features

1. User accounts
   - Needed for server-synced favorites, history, reading progress, and preferences.
   - Required technology: authentication provider, user database, privacy policy update.

2. Comment system
   - Needed for reader discussion and editorial feedback.
   - Required technology: database, moderation queue, spam protection, abuse reporting.

3. User submissions
   - Needed for public story intake.
   - Required technology: submission form, database, review workflow, rights confirmation, moderation UI.

4. Real popularity ranking
   - Needed for ranking by views, favorites, completion rate, or shares.
   - Required technology: analytics pipeline, event schema, privacy disclosure, bot filtering.

5. Ratings and reactions
   - Needed for reader-scored fear level and quality signals.
   - Required technology: user/session identity, rate limiting, abuse prevention.

6. Audio narration
   - Needed for kaidan reading/listening mode.
   - Required technology: recording rights, audio hosting, player UI, captions/transcripts, optional paid voice generation.

7. Paid content and memberships
   - Needed for paid long-form stories, premium narration, or ebooks.
   - Required technology: payment processor, account system, entitlement checks, refund policy.

8. Newsletter
   - Needed for weekly story recommendations.
   - Required technology: email service, consent logging, unsubscribe handling.

9. Ad network integration
   - Needed for display ads and affiliate slots.
   - Required technology: ad config, consent handling where required, performance monitoring.

10. Editorial CMS
    - Needed for non-developer story editing.
    - Required technology: headless CMS or Git-backed editor, preview workflow, role management.

## Recommended Order

1. Submission review workflow
2. Real analytics and popularity ranking
3. Account-backed favorites and history
4. Comments with moderation
5. Narration and paid content
