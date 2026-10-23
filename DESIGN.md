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
  send: "#21883a"
  send-hover: "#1b7431"
  white: "#ffffff"
  focus: "#3264af"
  dark-hover: "#30362f"
  chip-selected: "#dff3dc"
  chip-selected-ink: "#234d28"
typography:
  display:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "clamp(40px, 5.4vw, 64px)"
    fontWeight: 800
    lineHeight: 1.06
    letterSpacing: "-0.04em"
  display-arabic:
    fontFamily: '"Noto Sans Arabic Variable", sans-serif'
    fontWeight: 750
    lineHeight: 1.3
    letterSpacing: "0"
  title:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "18px"
    fontWeight: 800
    letterSpacing: "-0.025em"
  body:
    fontFamily: '"Manrope Variable", sans-serif'
    fontSize: "15px"
  body-arabic:
    fontFamily: '"Noto Sans Arabic Variable", sans-serif'
    fontSize: "15px"
  label:
    fontFamily: '"Manrope Variable", sans-serif'
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
    textColor: "{colors.white}"
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

Soft tonal layers carry the layout; dark action controls and the green WhatsApp handoff provide clear points of action. Rounded cards, circular arrows, quiet organic shapes, and brief spring motion form the recurring visual language.

**Key Characteristics:**

- Cream canvas with blue, mint, lavender, and peach surfaces.
- Rounded horizontal contact tiles with icon blocks and dark circular arrows.
- Self-hosted bilingual typography and logical RTL composition.
- A content-driven bottom sheet shared by contact actions.

## Colors

The palette pairs warm cream and dark botanical ink with gentle colored surfaces. The frontmatter records the shared primitives; the stylesheet also uses local gradients and supporting tints.

### Primary

- **WhatsApp action green** (`send`, `send-hover`): white-text handoff button and its hover state.
- **Bright icon green** (`green`): the WhatsApp sheet icon, separate from the darker action button.

### Secondary

- **Powder blue** (`blue`): website emphasis, language-menu highlight, and blue sheet decoration. Featured and save-contact cards use related blue gradients.
- **Soft mint** (`mint`), **lavender** (`purple`), and **warm peach** (`peach`): the pastel family behind contact identities. Contact tiles use their corresponding light gradients rather than one universal flat fill.

### Neutral

- **Warm paper** (`surface`): page and sheet background.
- **Botanical ink** (`ink`): primary text and dark pill actions.
- **Muted olive gray** (`muted`): greeting and introductory copy.
- **White** (`white`): icon circles, close controls, and reversed action labels.
- **Focus blue** (`focus`): keyboard outlines.

**The Green Roles Rule.** Keep the bright icon green separate from the darker white-text handoff green.

## Typography

**Display and body fonts:** self-hosted Manrope Variable for Latin; self-hosted Noto Sans Arabic Variable when the document language is Arabic. Both use a sans-serif fallback. The implementation imports the font packages locally; it does not request a hosted font service.

The hierarchy uses heavy friendly headings, compact labels, and subdued supporting text. Base body copy uses the frontmatter body role without a global line-height override.

- **Display:** the profile name follows the fluid display role. At the mobile breakpoint it becomes (42px), then (35px) below the narrow breakpoint. Arabic uses untracked text, a looser line height, and mobile sizes of (38px) and (33px).
- **Section headings:** featured website heading (32px, weight 800), sheet heading (24px, weight 800), and QR/save headings (20px/19px). Their mobile counterparts are (25–32px), (21px), and (15px/14px).
- **Contact title:** the title role becomes (14px) on mobile and (12px) at narrow widths. Arabic uses (17px), then (13px), then (11px), without negative tracking.
- **Supporting copy:** introductory text (19px, line-height 1.45); contact subtitles (12px, line-height 1.45). Mobile values are (15px) and (10px), with script-specific reductions.
- **Labels:** dark actions use the label role; quick-message chips use (11px), then (10px) on mobile. Textarea text is (15px, line-height 1.6), increasing to (16px) on mobile.

## Layout

The centered page has a maximum canvas width of (860px), including its padding. Default page padding is (45px 30px 40px). At widths up to (650px), padding becomes (30px 18px 24px); below (359px), horizontal padding becomes (14px). At widths from (1100px), top padding grows to (55px).

The hero is horizontal on larger screens, with a circular avatar (220px) beside the text. Mobile places a smaller avatar (132px; 112px at narrow widths) at the logical end of the hero. Three pill badges occupy a single equal-width row.

The featured website spans the content width. Contact cards stay in two equal columns at every breakpoint, and each tile retains its horizontal icon–copy–arrow composition. The closing row pairs QR and save-contact cards at (1.5fr / 1fr), changing to (1.4fr / 1fr) on large screens. Shared content gaps follow the frontmatter gap roles.

Logical margins, padding, and positioning support RTL. Directional arrow controls reverse; brand marks remain unmirrored. The page clips horizontal decorative overflow. The bottom sheet is centered, at most (600px) wide and (85dvh) high, and adapts its bottom offset and maximum height to the visual viewport.

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

The full-width WhatsApp handoff uses the darker action green, white text, a rounded rectangular shape, and a minimum height of (57px), reduced to (53px) on mobile. Hover uses the dedicated darker green; press scales to (0.985). Disabled actions use a muted green fill and gray-green text. An email variant has a blue base fill; its current shared hover rule remains the send button's green hover.

### Chips and badges

Three informational category badges use equal-width pastel pills with a small icon and centered label. They are informational, without selected states.

Quick-message chips wrap within the composer. They use a fine pale border and transparent fill; hover and `aria-pressed="true"` share a mint fill, green border, and dark green text. Their minimum height is (40px).

### Cards / Containers

Contact tiles have a light gradient, rounded icon block, title/subtitle stack, and dark circular directional arrow. Default minimum height is (109px), becoming (90px) on mobile and (85px) at narrow widths. The entire tile is an anchor for a configured URL or a button for a sheet action.

The blue featured card follows the approved second reference: title and subtitle align at the logical start without a globe icon, the larger dark CTA sits below, and a website illustration fills the lower logical end without a floating arrow badge. It has a 210px desktop minimum height and a 2.15:1 mobile aspect ratio with fluid type and controls scaled from the card width. The preview is decorative interface imagery rather than evidence of a configured website. QR uses the dark inverse surface; add-to-contacts uses a blue gradient and a dark download action.

The QR module renders an explicit empty state until the canonical public URL is configured. It must not display a made-up QR destination. Other unconfigured destinations use the shared explanatory sheet.

### Inputs / Fields

The message composer wraps a resizable textarea and toolbar in a pale bordered container. Focus changes its border to green and adds a subtle green ring. A character counter uses tabular numerals, and an emoji control occupies its own circular target. Errors use a red border and red supporting text. The textarea remains internally scrollable and resizable within its height limits.

### Navigation

A circular ellipsis trigger opens the compact cream language menu. Menu items have softened corners and a blue highlighted state, with a checkmark for the selected language. Language choice persists locally. The skip link becomes visible on keyboard focus.

### Shared bottom sheet

One content-driven sheet hosts WhatsApp, email, and unavailable-destination content. It uses a cream surface, green or blue icon accent, close control, drag handle, localized title and description, and internally scrolling content. Inline padding is (26px), reducing to (19px) on mobile, with safe-area-aware bottom padding.

The scrim fades over (200ms). The sheet enters from below using a spring (stiffness 330, damping 34), and exit returns below the viewport. Dragging starts only from the handle; a downward displacement above (85px) or velocity above (650px/s) dismisses it. Dialog focus moves to close on open and returns to the opening control on close. Escape, backdrop interaction, and close use the dialog dismissal behavior. Reduced motion removes the spring movement and fade duration.

## Do's and Don'ts

### Do:

- **Do** preserve the cream, pastel, rounded bento world and illustrated avatar.
- **Do** keep contact tiles horizontal in a two-column grid on mobile and desktop.
- **Do** use self-hosted Manrope for Latin and Noto Sans Arabic for Arabic.
- **Do** use the darker send color for white-text WhatsApp actions; reserve the brighter green for icon surfaces.
- **Do** preserve visible focus, reduced-motion behavior, and RTL-aware directional arrows.
- **Do** show the configured empty QR state until a canonical public URL is supplied.

### Don't:

- **Don't** present the fictional avatar as a verified portrait.
- **Don't** invent contact destinations or replace unavailable states with fabricated links.
- **Don't** mirror brand logos when changing reading direction.
- **Don't** force the bottom sheet to a fixed content height or attach dragging to its scrollable body.
- **Don't** replace the soft tonal layers with heavy borders or sharp rectangular cards.
