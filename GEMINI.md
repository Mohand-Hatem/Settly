# Settly Workspace Rules & Design Directive

## Mandatory Frontend & UI Design Rule: /impeccable Skill

Whenever building, designing, refactoring, or modifying any frontend screens, pages, components, or UI elements in Settly (including the 33 screens across Public, Auth, Buyer dashboard, Agent dashboard, and Admin):

1. **Mandatory Impeccable Skill Activation**:
   - You MUST ALWAYS read, apply, and strictly follow the /impeccable skill (.agents/skills/impeccable/SKILL.md).
   - Do NOT act on your own or produce generic AI templates, bare placeholders, or low-effort designs.
   - Every interface decision must adhere to Impeccable craft floor standards and design director quality.

2. **Settly Visual World & Design Tokens**:
   - **Colors**: Settly Deep Navy (#1E2A4A, #131D36), Brass (#C69749, #AE8033), Bone canvas (#F7F6F3, #EDE9DF), Sage accent (#3D5A4C).
   - **Typography**: Editorial Serif (Spectral) for luxury headlines; Clean Sans (Plus Jakarta Sans) for body and controls; Monospace (JetBrains Mono) for measured numerical values (EGP, m², coordinates, timestamps).
   - **Craft Floor**:
     - No generic AI slop (no harsh gradient text, no generic purple glow buttons, no unstyled boxes).
     - Framed vertical portrait cards (spect-ratio: 4 / 4.65) with genuine local imagery (../../../../Images/web/).
     - Zero horizontal blowouts (min-width: 0, proper flex/grid constraints).
     - High interactive tactile fidelity: authentic hover states, active pins, physics-tuned gliding popups, working view switches, and real GIS map interactions.

3. **Screen Inventory Progression (English First)**:
   - 33 screens across 6 groups:
     - **Public (9)**: Landing (done), Search results (list + map) (done), Property detail, Compare properties, Area list, Area detail, Market insights, Agent directory, Agent public profile.
     - **Auth (4)**: Login, Register, Verify email, Forgot / reset password.
     - **Buyer dashboard (9)**: Overview, Favorites / collections, Saved searches, My viewings, My offers, Messages, Notifications, My documents, Account settings.
     - **Agent dashboard (7)**: Overview, My listings, Create listing, Edit listing, Leads / pipeline, Viewings calendar, Analytics.
     - **Admin (5)**: Moderation queue, Agent verification, Reports, Audit log.
   - **Language Policy**: English version first across all screens.

4. **Mandatory Environment & Credentials Protocol**:
   - Whenever any feature, integration, or service requires `.env` credentials, API keys, secrets, or provider configuration (e.g., Resend API key, Cloudinary credentials, MapTiler key, Paymob secrets, Upstash Redis, Firebase/FCM, etc.), you MUST explicitly ask the user for them before implementing or proceeding.
   - Never invent placeholder keys for live integrations without user consent.