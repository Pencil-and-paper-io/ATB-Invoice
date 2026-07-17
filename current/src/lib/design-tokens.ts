/**
 * Design system catalog — mirrors the ATB Figma Library:
 * https://www.figma.com/design/OqPEqFxVANuTJDUarkml5D/Library?node-id=1-44
 *
 * Edit CSS variables and `.type-*` classes in `app/globals.css` to change the look.
 * This file drives the floating Styles panel.
 */

export type ColorToken = {
  id: string;
  label: string;
  hex: string;
  cssVar: string;
  swatchClass: string;
  usage: string;
};

export type TypeToken = {
  id: string;
  label: string;
  className: string;
  sample: string;
  usage: string;
  recipe: string;
};

/** Library colors from Figma node 1:44 */
export const COLOR_TOKENS: ColorToken[] = [
  {
    id: "sunshine-yellow",
    label: "Sunshine Yellow",
    hex: "#FCDC3E",
    cssVar: "--sunshine-yellow",
    swatchClass: "bg-sunshine-yellow",
    usage: "Accent / highlight",
  },
  {
    id: "melon-orange",
    label: "Melon Orange",
    hex: "#FF7F30",
    cssVar: "--melon-orange",
    swatchClass: "bg-melon-orange",
    usage: "Document accent borders",
  },
  {
    id: "sky-blue",
    label: "Sky Blue",
    hex: "#9DE3FF",
    cssVar: "--sky-blue",
    swatchClass: "bg-sky-blue",
    usage: "Light accent",
  },
  {
    id: "prime-blue",
    label: "Prime Blue",
    hex: "#0072F0",
    cssVar: "--prime-blue",
    swatchClass: "bg-prime-blue",
    usage: "Primary actions, nav, links",
  },
  {
    id: "midnight-ink",
    label: "Midnight Ink",
    hex: "#0E162A",
    cssVar: "--midnight-ink",
    swatchClass: "bg-midnight-ink",
    usage: "Secondary chrome, tooltips",
  },
  {
    id: "cloud-grey",
    label: "Cloud Grey",
    hex: "#F3F5F7",
    cssVar: "--cloud-grey",
    swatchClass: "bg-cloud-grey",
    usage: "Subtle surfaces",
  },
  {
    id: "white-snow",
    label: "White Snow",
    hex: "#FFFFFF",
    cssVar: "--white-snow",
    swatchClass: "bg-white-snow border border-black/10",
    usage: "Cards, panels, text on Prime Blue",
  },
  {
    id: "prime-blue-hover",
    label: "Prime Blue Hover",
    hex: "#0063D1",
    cssVar: "--prime-blue-hover",
    swatchClass: "bg-prime-blue-hover",
    usage: "Primary button hover (prototype)",
  },
  {
    id: "delete-red",
    label: "Delete Red",
    hex: "#C3004E",
    cssVar: "--delete-red",
    swatchClass: "bg-delete-red",
    usage: "Destructive actions (prototype)",
  },
  {
    id: "input-grey",
    label: "Input Grey",
    hex: "#F8F9FB",
    cssVar: "--input-grey",
    swatchClass: "bg-input-grey",
    usage: "Form field backgrounds (prototype)",
  },
  {
    id: "status-info",
    label: "Status Info",
    hex: "#3C6CFF",
    cssVar: "--status-info",
    swatchClass: "bg-status-info",
    usage: "Awaiting / viewed badges (prototype)",
  },
  {
    id: "status-danger",
    label: "Status Danger",
    hex: "#C62828",
    cssVar: "--status-danger",
    swatchClass: "bg-status-danger",
    usage: "Rejected / expired badges (prototype)",
  },
  {
    id: "badge-purple",
    label: "Badge Purple",
    hex: "#9A60DB",
    cssVar: "--badge-purple",
    swatchClass: "bg-badge-purple",
    usage: "Tax / discount chips (prototype)",
  },
];

/** Library typography from Figma node 1:44 */
export const TYPE_TOKENS: TypeToken[] = [
  {
    id: "headline-1",
    label: "Headline 1",
    className: "type-headline-1",
    sample: "Headline 1",
    usage: "Largest display",
    recipe: "ATB TT Norms · 50px · Bold",
  },
  {
    id: "headline-2",
    label: "Headline 2",
    className: "type-headline-2",
    sample: "Draft Invoice",
    usage: "Page titles",
    recipe: "ATB TT Norms · 42px · Bold",
  },
  {
    id: "headline-3",
    label: "Headline 3",
    className: "type-headline-3",
    sample: "QT - 0003",
    usage: "Document IDs",
    recipe: "ATB TT Norms · 30px · Bold",
  },
  {
    id: "headline-4",
    label: "Headline 4",
    className: "type-headline-4",
    sample: "$3,555.99",
    usage: "Amounts, modal titles",
    recipe: "Inter · 24px · Bold",
  },
  {
    id: "headline-5",
    label: "Headline 5",
    className: "type-headline-5",
    sample: "Customer Details",
    usage: "White box / card titles (Bill to, Customer Details, etc.)",
    recipe: "Inter · 18px · Semi Bold",
  },
  {
    id: "headline-6",
    label: "Headline 6",
    className: "type-headline-6",
    sample: "Business Details",
    usage: "Section headings",
    recipe: "Inter · 16px · Semi Bold",
  },
  {
    id: "subtitle-1",
    label: "Subtitle 1",
    className: "type-subtitle-1",
    sample: "Save and Preview",
    usage: "Button labels, strong UI text",
    recipe: "Inter · 14px · Semi Bold",
  },
  {
    id: "subtitle-2",
    label: "Subtitle 2",
    className: "type-subtitle-2",
    sample: "TEMPLATES",
    usage: "Eyebrows, meta",
    recipe: "Inter · 12px · Semi Bold",
  },
  {
    id: "hero-paragraph",
    label: "Hero Paragraph",
    className: "type-hero-paragraph",
    sample: "Hero Paragraph",
    usage: "Lead body copy",
    recipe: "Inter · 18px · Regular",
  },
  {
    id: "paragraph-1",
    label: "Paragraph 1",
    className: "type-paragraph-1",
    sample: "Acme Construction Co",
    usage: "Larger body / names",
    recipe: "Inter · 16px · Regular",
  },
  {
    id: "paragraph-2",
    label: "Paragraph 2",
    className: "type-paragraph-2",
    sample: "These will appear at the bottom of your quote.",
    usage: "Default body copy",
    recipe: "Inter · 14px · Regular",
  },
];

/** Shared UI class names — defined in globals.css */
export const UI_CLASS = {
  input: "ui-input",
  btnPrimary: "ui-btn-primary",
  btnSecondary: "ui-btn-secondary",
  /** White card shell — children are spaced 10px apart (component rule) */
  sectionShell: "ui-section-shell",
  hoverCard: "ui-hover-card",
} as const;
