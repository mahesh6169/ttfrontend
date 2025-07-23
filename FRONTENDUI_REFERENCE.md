# Telugufy Design Reference

## Core Design Principles
- Mobile-first approach with progressive enhancement
- Consistent spacing and typography across all components
- Clear visual hierarchy using color and size
- Accessible contrast ratios for all text

## Color Palette
### Primary Colors
- Teal-700: Primary brand color (headers, primary buttons)
- Lime-100: Primary text on dark backgrounds
- Amber-400: Accent color for CTAs and highlights
- Teal-800: Hover state for primary elements

### Neutral Colors
- Gray-800: Primary text
- Gray-600: Secondary text
- Gray-300: Borders
- Gray-50: Light backgrounds

### Semantic Colors
- Red-500/600: Errors, warnings, wishlist
- Green-600: Success states
- Yellow-400: Accent highlights

## Typography Scale
### Headings
- H1: text-xl md:text-2xl lg:text-3xl font-bold
- H2: text-base sm:text-lg font-bold
- H3: text-sm sm:text-base font-semibold

### Body Text
- Large: text-sm sm:text-base
- Default: text-sm
- Small: text-xs

### Responsive Text Pattern
```
text-sm sm:text-base (mobile:small, desktop:base)
text-xs sm:text-sm (mobile:extra-small, desktop:small)
```

## Spacing System
### Container Padding
- Mobile: px-2
- Desktop: px-4

### Section Spacing
- Between sections: my-4
- Between elements: mb-2
- Inner padding: p-2 sm:p-4

## Header
### Colors
- Background: bg-teal-700
- Text: text-lime-100
- Hover: bg-lime-50 text-teal-700
- Active: bg-lime-100 text-teal-700
- Notification: text-red-700 animate-pulse
- Mobile overlay: bg-black opacity-30
- Dividers: border-lime-200/30

### Text Sizes
- Logo: text-3xl (all screens)
- Nav links desktop (≥768px): text-base (default)
- Nav links mobile (<768px): text-sm

### Spacing
- Header padding: py-2
- Nav link padding: px-2 md:px-3 lg:px-4 py-2
- Nav items gap: gap-6
- Mobile menu spacing: space-y-2

### Layout
- Container: container mx-auto
- Mobile menu width: w-50

### Borders & Effects
- Nav link radius: rounded
- Header shadow: shadow

## Footer
### Colors
- Background: bg-teal-700 (same as header)
- Text: text-lime-100 (same as header)
- Link hover: hover:underline
- Social icon hover: hover:text-lime-50
- Bullet separators: text-lime-300

### Text Sizes
- All text: text-sm
- Social icons: size={16}

### Spacing
- Footer padding: py-2 (same as header)
- Container padding: px-4
- Gap between links: gap-3
- Gap between social icons: gap-2
- Row spacing: mt-2

### Layout
- Container: container mx-auto (same as header)
- Row 1: centered links
- Row 2: copyright left, social right

### Borders & Effects
- Footer shadow: shadow (same as header)
- Top margin: mt-8

## Buttons
### Primary Button (CTA)
- Background: bg-teal-700
- Text: text-lime-100
- Hover: hover:bg-teal-800 hover:text-lime-50
- Padding: px-4 py-2
- Text size: text-sm md:text-base
- Border radius: rounded
- Shadow: shadow
- Font weight: font-semibold

### Action Button (Post/Create)
- Background: bg-amber-400
- Text: text-teal-800
- Hover: hover:bg-amber-500 hover:text-teal-900
- Padding: px-4 py-2
- Text size: text-sm md:text-base
- Border radius: rounded
- Shadow: shadow
- Font weight: font-semibold

## Page Controls (Filter/Sort/Search)
### Mobile (<768px)
- Padding: px-3 py-1.5
- Text size: text-sm
- Icon size: w-3 h-3
- Gap: gap-1

### Desktop (≥768px)
- Padding: px-4 py-2
- Text size: text-sm (kept consistent)
- Icon size: w-4 h-4
- Gap: gap-2

### Style
- Background: bg-white
- Border: border border-gray-300
- Hover: hover:bg-gray-50
- Border radius: rounded

## Hero Banners
### Modern Card Style
- Background: bg-white
- Border: border-2 border-teal-700
- Padding: p-6
- Border radius: rounded-lg
- Shadow: shadow
- Title colors: text-amber-500 and text-teal-700 alternating
- Title size: text-xl md:text-2xl lg:text-3xl
- Subtitle: text-gray-600 text-sm

## Detail Page Layout (Adverts/Events/Threads)
### Page Structure
```
Container: px-2
├── Navigation Bar (sticky top)
├── Main Content Grid
│   ├── Primary Content (flex-[7])
│   └── Secondary Content (flex-[3]) - desktop only
└── Mobile Secondary Content - below main
```

### Navigation Bar
- Back button: bg-yellow-400 text-teal-700 hover:bg-teal-700 hover:text-lime-100
- Button shape: rounded-tr-xl rounded-bl-xl
- Report link: text-red-600 hover:text-red-800
- Spacing: mt-4 flex justify-between

### Content Cards
#### Card Container
- Background: bg-white
- Border: border rounded
- Shadow: shadow-md
- Padding: Varies by content

#### Image Gallery
- Container: relative w-full bg-gray-200
- Navigation buttons: bg-yellow-300 text-teal-700 p-2 rounded-full
- Image display: object-contain w-full h-full
- Wishlist button: Position absolute top-2 right-2

#### Title Section
- Container: my-2 px-2
- Title: text-base sm:text-lg font-bold text-gray-800
- Alignment: text-center

#### Metadata Rows
- Container: flex justify-start gap-1 sm:gap-4
- Text: text-sm sm:text-base text-gray-800
- Spacing: mb-2 px-2

#### Info Sections
- Container: border rounded shadow-md my-4 mx-2
- Header: text-sm sm:text-base font-semibold mb-2
- Content padding: px-2

#### Dynamic Fields Grid
- Layout: grid grid-cols-1 sm:grid-cols-2 gap-2
- Field text: text-sm sm:text-base
- Label style: font-bold

## Interactive Elements
### Wishlist Button
- Active: bg-red-500 hover:bg-red-600 text-white
- Inactive: bg-gray-300 hover:bg-gray-400 text-gray-700
- Icon size: text-sm sm:text-base md:text-lg

### Image Navigation
- Button style: bg-yellow-300 text-teal-700 rounded-full
- Position: absolute left/right-2 top-1/2 -translate-y-1/2
- Hover: Add hover:bg-yellow-400 transition

### Fullscreen Modal
- Overlay: fixed inset-0 bg-black bg-opacity-90 z-50
- Image: object-contain w-[95vw] h-[95vh] sm:w-[78vw] sm:h-[78vh]
- Close button: bg-yellow-300 text-teal-700 rounded-full

## Responsive Breakpoints
- Mobile: Default (< 640px)
- Small: sm: (≥ 640px)
- Medium: md: (≥ 768px)
- Large: lg: (≥ 1024px)

## Component Patterns
### Info Block Pattern
```html
<div className="text-sm sm:text-base text-gray-800 mb-2 px-2 text-left">
  <strong>Label:</strong> Value
</div>
```

### Section Container Pattern
```html
<div className="border px-2 rounded shadow-md text-left my-4 mx-2">
  <h3 className="text-sm sm:text-base font-semibold mb-2">Section Title</h3>
  <div className="content">
    <!-- Section content -->
  </div>
</div>
```

### Responsive Flex Pattern
```html
<div className="flex flex-col lg:flex-row gap-4">
  <div className="flex-[7]">Primary</div>
  <div className="flex-[3]">Secondary</div>
</div>
```