# Leads / Communication System

## Overview
Direct messaging between users with opt-out for tutors.

## Steps
1. SQL migration: `direct_conversations` + `direct_messages` tables + `is_open_to_messages` on profiles
2. TypeScript types for conversations/messages
3. Hook: `useDirectMessages.ts`
4. UI: MessagesSection component for dashboard sidebar
5. Wire up "Contact via App" button on ProfileViewPage
6. Opt-out toggle in profile settings
