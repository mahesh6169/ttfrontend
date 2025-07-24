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
- Back button: bg-amber-400 text-teal-800 hover:bg-amber-500 hover:text-teal-900
- Button style: px-4 py-2 rounded shadow font-semibold text-sm md:text-base
- Report link: text-red-600 hover:text-red-800
- Spacing: mt-4 flex justify-between

### SingleAdvertCard (Detail View)
#### Main Container
- Outer: border rounded shadow-md mx-auto
- Content wrapper with subtle type indicator:
  - Offered: border border-teal-100
  - Wanted: border border-amber-100

#### Image Gallery
- Container: relative w-full mx-auto bg-gray-200 flex overflow-hidden rounded
- Navigation buttons: bg-yellow-300 text-teal-700 p-2 rounded-full shadow
- Button positioning: absolute left/right-2 top-1/2 -translate-y-1/2
- Image display: object-contain w-full h-full cursor-pointer
- Wishlist button: absolute top-2 right-2
  - Active: bg-red-500 hover:bg-red-600 text-white
  - Inactive: bg-gray-300 hover:bg-gray-400 text-gray-700

#### Title Section
- Container: my-2 px-2
- Title: text-base sm:text-lg text-center font-bold my-1 px-2 text-gray-800 break-words

#### Section Container Pattern (REUSABLE)
```html
<div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
  <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
    <h3 className="text-sm sm:text-base font-semibold text-gray-800">Section Title</h3>
  </div>
  <div className="p-3">
    <!-- Content -->
  </div>
</div>
```

#### Main Details Section
- Grid layout: grid grid-cols-1 sm:grid-cols-2 gap-3
- Field pattern:
  - Label: font-semibold text-gray-700
  - Value: text-gray-600
  - Full width items: sm:col-span-2
- Price display: Uses getPriceLabel function for dynamic pricing

#### Additional Details (Dynamic Fields)
- Same section container pattern
- Grid: grid-cols-1 sm:grid-cols-2 gap-3
- Field name formatting: formatFieldName function (camelCase to Title Case)

#### Description Section
- Same section container pattern
- Text: text-sm sm:text-base text-gray-700 space-y-2
- Paragraph handling: Split by \n with leading-relaxed

#### Chat Integration
- Desktop: Displayed in secondary content area (flex-[3])
- Mobile: Positioned after Additional Details with block lg:hidden
- Container: px-2 my-4 (mobile only)

#### Fullscreen Modal
- Overlay: fixed inset-0 bg-black bg-opacity-90 z-50
- Image sizing: w-[95vw] h-[95vh] sm:w-[78vw] sm:h-[78vh]
- Navigation: Prev/Next buttons with text labels
- Close button: bg-yellow-300 text-teal-700 rounded-full shadow

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

## List Page Layout (/adverts, /events, /threads)
### Page Structure
```
Container: w-full
├── Post/Create Button (my-2 px-4)
├── Hero Banner (my-4 px-4)
├── Search Bar (sticky top-0 z-10)
├── Page Controls Bar
├── Active Filters Display
├── Content List (mt-4)
└── Pagination
```

### Search Bar
- Container: sticky top-0 z-10 bg-white shadow-sm
- Form: flex gap-2 p-3
- Input: flex-1 px-3 py-2 border rounded-md
- Search button: bg-teal-700 text-lime-100 px-4 py-2 rounded

### Page Controls Bar
- Container: flex justify-between items-center px-3 py-2
- Left side: Filter button + Clear all
- Right side: Sort dropdown
- Mobile filter modal: fixed inset-0 z-50

### Active Filters
- Container: bg-gray-50 border-y px-3 py-3
- Filter chips: bg-white border border-gray-300 px-3 py-1 rounded-full
- Remove button: font-bold ml-1 hover:text-gray-900
- Scrollable container: overflow-x-auto

### List Item Cards
#### Card Container (REUSABLE)
- Border: border rounded-lg shadow-md
- Background: bg-gray-100 hover:bg-gray-200
- Padding: Varies by content type

#### Image Section (REUSABLE)
- Container: relative w-full h-40 sm:h-48 md:h-56
- Image: object-cover rounded-md
- Fallback: bg-gray-200 flex items-center justify-center

#### Content Layout (REUSABLE)
- Title: text-xs sm:text-sm font-medium truncate
- Metadata: text-xs font-medium text-gray-600
- Location: flex items-center gap-1 with icon
- Date: text-right whitespace-nowrap

### Advert-Specific Features
#### Border Indicators (ADVERTS ONLY)
- Offered: border-l-4 border-teal-100
- Wanted: border-l-4 border-amber-100

#### Price Display (ADVERTS ONLY)
- Offered: Shows actual price
- Wanted: Shows "Wanted $$$"

## Form Components
### Form Container
- Max width: max-w-4xl mx-auto
- Padding: py-10
- Title: text-2xl font-bold mb-6

### Form Sections
- Section divider: border-t pt-4
- Section title: font-bold text-lg mb-4 text-gray-700
- Field spacing: space-y-4

### Input Fields
#### Text Input (REUSABLE)
```
w-full p-2 border rounded focus:outline-none focus:ring-2
Default: border-gray-300 focus:ring-teal-300
Error: border-red-500 focus:ring-red-300
```

#### Select/Dropdown (REUSABLE)
- Basic: Same as text input
- Enhanced (CategorySelector): Searchable with filter

#### Toggle Buttons (REUSABLE)
```
flex border rounded overflow-hidden
Active: bg-teal-600 text-white
Inactive: bg-white text-gray-700
```

### Image Uploader (REUSABLE)
- Max images display: "Current: X/10"
- Disabled state: bg-gray-100 cursor-not-allowed opacity-50
- Image preview: w-24 h-24 object-cover border rounded
- Remove button: absolute top-0 right-0 bg-red-500

### Dynamic Field System (ADVERTS ONLY)
- Field dependencies based on category
- Conditional visibility rules
- Dynamic placeholders for wanted ads

## Modal Patterns
### Filter Modal (REUSABLE)
- Overlay: fixed inset-0 bg-black bg-opacity-50 z-40
- Content: fixed inset-y-0 left-0 w-80 bg-white z-50
- Header: sticky top-0 bg-white border-b
- Footer: fixed bottom-0 bg-white border-t
- Mobile close button: w-full py-2 text-center

### Category Filter (REUSABLE)
- Container: max-h-64 overflow-y-auto border rounded-md
- Item: hover:bg-gray-50 p-2 rounded
- Checkbox: w-4 h-4 text-teal-600
- Count display: text-sm text-gray-600 mt-2

## Validation & Feedback
### Error Messages
- Container: bg-red-50 border border-red-200 rounded p-4
- Title: font-bold text-red-700 mb-2
- List: list-disc list-inside text-red-600

### Loading States
- Container: bg-blue-50 border border-blue-200 rounded p-4
- Text: text-blue-700

### Success Feedback
- Toast notifications via react-toastify
- Redirect after success with delay

## Responsive Patterns
### Mobile-First Approach
```
Default: Mobile styles
sm: ≥640px overrides
md: ≥768px overrides
lg: ≥1024px overrides
```

### Common Responsive Classes
- Text: text-xs sm:text-sm or text-sm sm:text-base
- Padding: px-3 sm:px-4
- Grid: grid-cols-1 sm:grid-cols-2
- Flex: flex-col lg:flex-row

## Component Patterns
### Info Block Pattern
```html
<div className="text-sm sm:text-base text-gray-800 mb-2 px-2 text-left">
  <strong>Label:</strong> Value
</div>
```

### Section Container Pattern
```html
<div className="border border-gray-300 rounded shadow-sm my-4 mx-2">
  <div className="bg-gray-50 px-3 py-2 border-b border-gray-300">
    <h3 className="text-sm sm:text-base font-semibold text-gray-800">Section Title</h3>
  </div>
  <div className="p-3">
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

### Grid Layout Pattern
```html
<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
  <div>Field 1</div>
  <div>Field 2</div>
</div>
```