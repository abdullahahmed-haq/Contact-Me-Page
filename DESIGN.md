---
name: Personal Connect Hub
description: A warm bilingual personal contact hub with tactile pastel cards.
colors:
  surface: "#fffcf7"
  ink: "#171917"
  muted: "#626760"
  blue: "#dce9ff"
  mint: "#e4f8da"
  purple: "#ebddff"
  peach: "#fff0d5"
  green: "#2db653"
  send: "#e4f8da"
  send-hover: "#d3eec6"
  send-ink: "#24462b"
  white: "#ffffff"
  focus: "#3264af"
  dark-hover: "#30362f"
  chip-selected: "#dff3dc"
  chip-selected-ink: "#234d28"
typography:
  display:
    fontFamily: '"Bricolage Grotesque", "Bricolage Grotesque Fallback", ui-sans-serif, system-ui, sans-serif'
    fontSize: "clamp(40px, 5.4vw, 64px)"
    fontWeight: 800
    lineHeight: 1.06
    letterSpacing: "-0.04em"
  display-arabic:
    fontFamily: 'Alexandria, "Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif'
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: "0"
  title:
    fontFamily: '"Bricolage Grotesque", "Bricolage Grotesque Fallback", ui-sans-serif, system-ui, sans-serif'
    fontSize: "18px"
    fontWeight: 800
    letterSpacing: "-0.025em"
  body:
    fontFamily: 'Figtree, "Figtree Fallback", ui-sans-serif, system-ui, sans-serif'
    fontSize: "15px"
  body-arabic:
    fontFamily: '"Noto Sans Arabic", Figtree, ui-sans-serif, system-ui, sans-serif'
    fontSize: "15px"
  label:
    fontFamily: 'Figtree, "Figtree Fallback", ui-sans-serif, system-ui, sans-serif'
    fontSize: "14px"
    fontWeight: 650
rounded:
  card: "28px"
  card-mobile: "24px"
  pill: "30px"
  field: "21px"
  send: "22px"
  sheet: "36px 36px 0 0"
  sheet-mobile: "34px 34px 0 0"
  circle: "50%"
spacing:
  space-1: "6px"
  space-2: "12px"
  space-3: "18px"
  space-4: "28px"
  space-5: "40px"
  gap: "14px"
  gap-mobile: "10px"
components:
  button-dark:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
    padding: "10px 23px"
    typography: "{typography.label}"
  button-dark-hover:
    backgroundColor: "{colors.dark-hover}"
  button-send:
    backgroundColor: "{colors.send}"
    textColor: "{colors.send-ink}"
    rounded: "{rounded.send}"
    width: "100%"
  button-send-hover:
    backgroundColor: "{colors.send-hover}"
  quick-chip:
    textColor: "#394936"
    rounded: "{rounded.pill}"
    padding: "8px 12px"
  quick-chip-selected:
    backgroundColor: "{colors.chip-selected}"
    textColor: "{colors.chip-selected-ink}"
  message-field:
    rounded: "{rounded.field}"
    textColor: "{colors.ink}"
  contact-card:
    rounded: "{rounded.card}"
    padding: "19px"
  bottom-sheet:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.sheet}"
---

# Design System: Personal Connect Hub

## Overview

**Creative North Star: "The Pastel Contact Bento"**

A warm personal introduction made from cream paper, pastel bento cards, and a fictional illustrated avatar. Large friendly names and small tactile controls give the page a personable, compact character. The self-hosted Latin and Arabic typefaces share the same hierarchy while respecting each script.

Soft tonal layers carry the layout; dark page controls and card-matched pastel sheet actions provide clear points of action. Rounded cards, circular arrows, quiet organic shapes, and brief spring motion form the recurring visual language.

**Key Characteristics:**

- Cream canvas with blue, mint, lavender, and peach surfaces.
- Rounded horizontal contact tiles with icon blocks and dark circular arrows.
- Self-hosted bilingual typography and logical RTL composition.
- A content-driven bottom sheet shared by contact actions.

## Colors

The palette pairs warm cream and dark botanical ink with gentle colored surfaces. The frontmatter records the shared primitives; the stylesheet also uses local gradients and supporting tints.

### Primary

- **Default sheet green** (`send`, `send-hover`, `send-ink`): pastel action fill, tonal hover and dark text for WhatsApp. Other sheets replace these roles with their source card’s palette.
- **Bright icon green** (`green`): the WhatsApp contact-card icon. Sheet header icons use a stronger tint from their own palette.

### Secondary

- **Powder blue** (`blue`): website emphasis, language-menu highlight, and blue sheet decoration. Featured and save-contact cards use related blue gradients.
- **Soft mint** (`mint`), **lavender** (`purple`), and **warm peach** (`peach`): the pastel family behind contact identities. Contact tiles use their corresponding light gradients rather than one universal flat fill.

### Neutral

- **Warm paper** (`surface`): page and sheet background.
- **Botanical ink** (`ink`): primary text and dark pill actions.
- **Muted olive gray** (`muted`): greeting and introductory copy.
- **White** (`white`): icon circles, close controls, and reversed action labels.
- **Focus blue** (`focus`): keyboard outlines.

**The Card Palette Rule.** Every sheet follows its source card. Enabled actions, disabled actions, header icon, decoration, chip selection and form focus all stay in that palette. Email is cream, GitHub lavender, LinkedIn pink, QR dark, website/save blue, and Portfolio mint.

## Typography

**Display and body fonts:** self-hosted Bricolage Grotesque for English headings and contact titles, paired with Figtree for supporting text, labels, buttons and fields. Arabic uses Alexandria for headings and Noto Sans Arabic for supporting text, with the matching English stacks for mixed-script content. Variable WOFF2 files use script-specific Unicode ranges and `font-display: swap`; the English stacks include metric-adjusted Arial fallbacks. Font files come from the same origin, without a hosted font service. The saved `manrope` theme value remains a compatibility key for this brand pairing; `system` overrides both heading and body fonts. Locale changes update portal typography as well as the page.

The hierarchy uses heavy friendly headings, compact labels, and subdued supporting text. Base body copy uses the frontmatter body role without a global line-height override.

- **Display:** the profile name follows the fluid display role. At the mobile breakpoint it becomes (42px), then (35px) below the narrow breakpoint. Arabic uses untracked text, a looser line height, and mobile sizes of (38px) and (33px).
- **Section headings:** featured website heading (32px, weight 800), sheet heading (24px, weight 800), and QR/save headings (20px/19px). Their mobile counterparts are (25–32px), (21px), and (15px/14px).
- **Contact title:** the title role becomes (14px) on mobile and (12px) at narrow widths. Arabic uses (17px), then (13px), then (11px), without negative tracking.
- **Supporting copy:** introductory text (19px, line-height 1.45); contact subtitles (12px, line-height 1.45). Mobile values are (15px) and (10px), with script-specific reductions.
- **Labels:** dark actions use the label role; quick-message chips use (11px), then (10px) on mobile. Textarea text is (15px, line-height 1.6), increasing to (16px) on mobile.

## Layout

The centered page has a maximum canvas width of (860px), including its padding. Default page padding is (45px 30px 40px). At widths from (360px) through (389px), contact-card gaps tighten to (4px) so both scripts retain their title sizes. At widths up to (650px), page padding becomes (30px 18px 24px); below (359px), horizontal padding becomes (14px). At widths from (1100px), top padding grows to (55px).

The hero is horizontal on larger screens, with a circular avatar (220px) beside the text. Mobile places a smaller avatar (132px; 112px at narrow widths) at the logical end of the hero. Three pill badges occupy a single equal-width row.

The featured website spans the content width. Contact cards stay in two equal columns at every breakpoint, and each tile retains its horizontal icon–copy–arrow composition. The closing row pairs QR and save-contact cards at (1.5fr / 1fr), changing to (1.4fr / 1fr) on large screens. Shared content gaps follow the frontmatter gap roles.

Logical margins, padding, and positioning support RTL. Directional arrows, the website illustration and asymmetric decorative shapes reflect in Arabic. Brand marks and QR images remain unmirrored. Card ornaments follow their logical corner, and the sheet uses a tapered, smooth corner accent behind its close control. The page clips horizontal decorative overflow. The bottom sheet is centered, at most (600px) wide and (85dvh) high, and adapts its bottom offset and maximum height to the visual viewport.

**The Two-Column Rule.** Preserve two contact columns and horizontal tile composition across the implemented viewport sizes.

## Elevation & Depth

Depth comes from pastel gradients, faint organic shapes, and soft ambient shadows. Cards rest on the cream canvas without structural borders. Contact hover raises a card slightly; the sheet uses a stronger upward shadow and a dimmed, lightly blurred scrim. Exact shadow and motion values live in the sidecar.

- **Ambient surface:** menu controls, featured card, contact tiles, and close button share the soft surface shadow.
- **Hover lift:** contact tiles move upward (3px) and strengthen their shadow; active tiles scale to (0.98).
- **Overlay depth:** scrim and sheet occupy adjacent layers (50/51); the scrim blurs the background (2px).

Page sections reveal over (500ms) with a short upward movement and small stagger. Ordinary state transitions use the shared duration (220ms). With reduced motion enabled, CSS animation and transitions are removed, scrolling is immediate, and sheet/scrim animation duration becomes zero.

## Shapes

Large softened rectangles define the cards, with the shared card radius and responsive variants in frontmatter. The featured mobile card uses (26px) corners; closing cards use (25px). Dark actions and category badges are pills. Contact icon blocks are smaller rounded rectangles; arrow, menu, close, and globe controls are circles. The avatar is circular with a small cream outline and an irregular mint shape behind it.

The bottom sheet has rounded top corners and square bottom corners. Its drag handle is a short centered capsule (46px × 5px). Decorative circles and irregular blobs stay behind content and remain noninteractive.

## Components

### Buttons

Dark pill actions use ink and white with a minimum height of (44px), darken on hover, and compress slightly on press. The featured and save-contact contexts use smaller mobile variants. Global keyboard focus is a visible (3px) blue outline with (4px) offset.

Full-width sheet actions use the source card’s pastel fill with contrasting dark text, except the dark QR action which uses white text. Minimum height is (57px), reduced to (53px) on mobile. Hover uses a stronger tint of the same hue; press scales to (0.985). Disabled actions retain the same palette at reduced opacity. No email state falls back to green or blue.

### Chips and badges

Three informational category badges use equal-width pastel pills with a small icon and centered label. They are informational, without selected states.

Quick-message chips wrap within the composer. They use a fine pale border and transparent fill; hover and `aria-pressed="true"` use the active sheet’s palette. Their minimum height is (40px).

### Cards / Containers

Contact tiles have a light gradient, rounded icon block, title/subtitle stack, and dark circular directional arrow. Default minimum height is (109px), becoming (80px) on mobile, with 40px icon blocks (34×36px below 359px), fluid 11–13px labels, and compact 3px text gaps. Supporting copy wraps to at most two lines. The entire tile is a button opening its own sheet; configured destinations become links only inside the sheet.

The blue featured card follows the approved second reference: title and subtitle align at the logical start without a globe icon, the larger dark CTA sits below, and a website illustration fills the lower logical end without a floating arrow badge. It has a 210px desktop minimum height and a 2.15:1 mobile aspect ratio with fluid type and controls scaled from the card width. The preview is decorative interface imagery rather than evidence of a configured website. QR uses the dark inverse surface; add-to-contacts uses a blue gradient and a dark download action.

The QR module renders an explicit empty state until the canonical public URL is configured. It must not display a made-up QR destination. Other unconfigured destinations retain their own title, icon and palette in the explanatory sheet.

### Inputs / Fields

The message composer wraps a resizable textarea and toolbar in a pale bordered container. Focus changes its border and ring to the active sheet’s palette. A character counter uses tabular numerals, and an emoji control occupies its own circular target. Errors use a red border and red supporting text. The textarea remains internally scrollable and resizable within its height limits.

### Navigation

A circular ellipsis trigger opens the compact cream language menu. Menu items have softened corners and a blue highlighted state, with a checkmark for the selected language. Language choice persists locally. The skip link becomes visible on keyboard focus.

### Shared bottom sheet

One content-driven sheet hosts every card action: WhatsApp/email composers, external links, QR preview with PNG/SVG downloads, and vCard details/download. It uses a cream surface and the source card’s palette for the icon, decoration and all action states, plus a close control, drag handle, localized title/description and internally scrolling content. The selected content stays mounted with its own palette during exit, avoiding closing-animation color changes. Inline padding is (26px), reducing to (19px) on mobile, with safe-area-aware bottom padding.

The scrim fades over (200ms). The sheet enters from below using a spring (stiffness 330, damping 34), and exit returns below the viewport. Dragging starts only from the handle; a downward displacement above (85px) or velocity above (650px/s) dismisses it. Dialog focus moves to close on open and returns to the opening control on close. Escape, backdrop interaction, and close use the dialog dismissal behavior. Reduced motion removes the spring movement and fade duration.

## Do's and Don'ts

### Do:

- **Do** preserve the cream, pastel, rounded bento world and illustrated avatar.
- **Do** keep contact tiles horizontal in a two-column grid on mobile and desktop.
- **Do** use Bricolage Grotesque/Figtree for English and Alexandria/Noto Sans Arabic for Arabic, with self-hosted variable fonts.
- **Do** keep every sheet and all action states in its source card’s color family with readable contrast.
- **Do** preserve visible focus, reduced-motion behavior, and RTL-aware directional arrows.
- **Do** show the configured empty QR state until a canonical public URL is supplied.

### Don't:

- **Don't** present the fictional avatar as a verified portrait.
- **Don't** invent contact destinations or replace unavailable states with fabricated links.
- **Don't** mirror brand logos when changing reading direction.
- **Don't** force the bottom sheet to a fixed content height or attach dragging to its scrollable body.
- **Don't** replace the soft tonal layers with heavy borders or sharp rectangular cards.


## Admin workspace extension

This supplement applies only to Connect Studio (`/admin`). The public frontmatter, public sections above, and `.impeccable/design.json` remain the authority for the public website. Admin values and component samples are recorded separately in [docs/admin-design-tokens.json](docs/admin-design-tokens.json), an independent documentation reference rather than a replacement for the public live-panel sidecar.

### Overview

Connect Studio is the Operate extension of the Pastel Contact Bento: cream panels, botanical ink, quiet sage selection, and compact forms. It uses the existing illustrated avatar; no new raster assets were generated. The workspace puts editing, draft status and deliberate publication together, while its iframe preview renders the actual public `ConnectPage` and contact sheets.

### Colors

Warm paper frames the sidebar, top bar and panels against a cooler pale canvas. Dark botanical actions identify Publish and primary editor actions; sage identifies active navigation and published status. Amber identifies unsaved or saved draft changes. Terracotta identifies errors and failed activity, with an alert icon rather than a success check. Supporting copy and fine dividers stay muted. Exact admin values and source locations live in the separate sidecar.

### Typography

The same heading/body pairings continue in the admin workspace at a denser scale: body (14px, line-height 1.5), page heading (30px/25px mobile, weight 800), panel heading (18px/17px mobile, weight 750), and form labels/inputs/buttons (12px). Supporting labels use (10–11px). Activity timestamps are (10px) on desktop and (11px) on mobile; mobile activity names become (12px). Arabic headings remove Latin negative tracking.

### Layout

The fixed sidebar is (236px); the top bar is (72px). Content has (36px) padding, a (1700px) maximum width, and (24px) workspace gaps. Form panels use (27px) padding; the editor column is at most (1080px). Preview occupies a (412px) column and moves above the editor at widths up to (1250px). At (1450px) and above, horizontal content padding grows to (45px).

At widths up to (1000px), the sidebar narrows to (210px) and content padding becomes (28px 22px). Up to (760px), navigation becomes a (245px) dismissible overlay, the top bar becomes (64px), content padding becomes (25px 16px), and publication actions wrap. Up to (380px), paired fields and bilingual editors become one column. Logical spacing, end alignment and opposite drawer movement support RTL; preview language is independent of editor language.

### Elevation & Depth

Cream panels use a restrained ambient shadow, with fine rules separating navigation, publication status and lists. Buttons and links transition background/shadow over (160ms); the mobile drawer moves over (180ms). Loading placeholders pulse. Reduced-motion preferences remove admin animations and transitions.

### Shapes

Panel corners are (16px), reducing to (14px) on mobile. Fields and navigation items use (9px), buttons (10px), secondary containers (12px), and status pills (30px). These admin dimensions do not redefine public card geometry.

### Components

Primary and secondary buttons have a (40px) minimum height; ordinary icon buttons are (36px). Disabled controls use (0.45) opacity. Fields have a (43px) minimum height, thin border, and a visible green (2px) focus outline; buttons/links retain the shared blue keyboard outline. Textareas resize vertically.

The publication strip distinguishes “Unsaved changes”, “Draft changes” and “Published content”, includes the last-publication timestamp or original-content state, and keeps Save draft beside Publish. Busy controls display “Working…”. Validation errors expose paths; success/error toasts and retryable resource states provide feedback. The overview shows real content counts and an explicit analytics empty state when disabled. Activity uses green checks for ordinary records and terracotta alerts for failed records; mobile timestamps wrap onto their own line.

### Do's and Don'ts

- **Do** preserve the compact administrative scale, visible keyboard focus, RTL alignment and separate editor/preview language choices.
- **Do** preview edits through the shared public components before publication; preserve approved default public gradients and geometry until the corresponding theme customization is edited.
- **Don't** substitute invented analytics or success indicators for empty/error states.
- **Don't** apply admin radii, density or tokens to the public page.

Implementation sources: `app/admin/admin.css`, `components/admin/`, and the public customization guards in `components/connect-page.tsx`/`app/globals.css`. Visual evidence: `.impeccable/review/desktop.png`, `.impeccable/review/mobile.png`, and `artifacts/admin/arabic-mobile.png`. Final finish-review approval covers the reviewed English overview; the Arabic activity screenshot supplies additional RTL evidence, not a review of every admin screen.
