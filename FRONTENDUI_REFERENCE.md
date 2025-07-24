# Telugufy Design Reference

## Core Design Principles
- Mobile-first approach with progressive enhancement
- Consistent spacing and typography across all components
- Clear visual hierarchy using color and size
- Accessible contrast ratios for all text

## Common Patterns Across Features
### Shared Between Adverts & Events
- Section container pattern with gray headers
- Grid layouts for details (grid-cols-1 sm:grid-cols-2)
- Image gallery with yellow navigation buttons
- Wishlist button styling and positioning
- Back button and report link in navigation bar
- Sticky search bar with consistent styling
- Filter/Sort controls in page controls bar
- Active filters display below controls
- Pagination component
- Mobile chat placement (different positions)

### Key Differences
- Adverts: Grid layout (2/3/4 columns), border indicators for offered/wanted
- Events: Grid layout, no border differentiation
- Threads: Single column, horizontal cards, Reddit-style
- Adverts: Dynamic fields in "Additional Details"
- Events: Fixed fields in multiple sections  
- Threads: Discussion-focused with chat interface
- Adverts: Price display logic
- Events: Capacity and ticket information
- Threads: Comment count and activity indicators
- Adverts: Mobile chat after additional details
- Events: Mobile chat at very bottom
- Threads: Chat interface integrated in main content

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

### Action Button (Post/Create/Register)
- Background: bg-amber-400
- Text: text-teal-800
- Hover: hover:bg-amber-500 hover:text-teal-900
- Padding: px-4 py-2
- Text size: text-sm md:text-base
- Border radius: rounded
- Shadow: shadow
- Font weight: font-semibold
- Used for: Post Advert, Create Event, Register for Event, Purchase Tickets

### Danger Button (Unregister/Cancel)
- Background: bg-red-500
- Text: text-white
- Hover: hover:bg-red-600
- Same padding, text size, and other properties as Action Button
- Used for: Unregister from Event

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

### SingleEventCard (Detail View)
#### Main Structure (EVENTS)
- Same container: border rounded shadow-md mx-auto
- No type-based border differentiation
- All sections use consistent gray header pattern
- Mobile chat at bottom (not after additional details)

#### Section Organization (EVENTS)
1. Image Gallery - Same as adverts with yellow buttons
2. Title Section - Centered, same styling
3. Event Details - Main info grid
4. Event Organizer - Optional section
5. Coordinators - Optional grid layout
6. Description - Same pattern as adverts
7. Capacity Display - Within section container
8. Available Tickets - Paid events only
9. Action Buttons - Registration/Purchase
10. Mobile Chat - At very bottom

#### Event Details Grid (EVENTS ONLY)
- Section header: "Event Details"
- Fields: Date, Time (with timezone), Venue, Address, Category, Organized By, Event Code, Type
- Date/Time combined in one field with timezone in parentheses
- Type shows "Paid Event" or "Free Event"

#### Event Organizer Section (EVENTS ONLY)
- Only shows if organizer data exists
- Fields displayed as label: value pairs
- Website and email as clickable links
- Social media as inline pills: px-2 py-1 bg-gray-100 rounded text-xs

#### Coordinators Grid (EVENTS ONLY)
- Only shows if coordinators with data exist
- Each coordinator in bordered card: border border-gray-200 rounded p-2
- Compact display without field labels
- Email as clickable link

#### Capacity Display (EVENTS ONLY)
- Within "Event Capacity" section
- Grid layout matching detail sections
- Dynamic content based on event type
- Red text for sold out/fully booked status

#### Ticket Section (PAID EVENTS ONLY)
- Section header: "Available Tickets"
- Each ticket: border border-gray-200 rounded p-3
- Price right-aligned with GST notation
- Dynamic status messages with appropriate colors
- Uses getTicketSaleStatus helper

### Event List Page Patterns
#### Clear All Button Behavior
- Clears all filters AND search text
- Only shows when filters are active
- Positioned left of filter button

#### Event Registration/Action Buttons
- Free events: "Register for Event" using Action Button style
- Paid events: "Purchase Tickets" using Action Button style
- Unregister: Uses Danger Button style
- All use consistent amber/teal color scheme

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

### Page Controls Bar (CONSISTENT ACROSS ALL PAGES)
- Container: flex gap-2 md:gap-3 justify-center
- Filter button: Shows active filter count badge
- Sort button: Shows current sort option in button text
- Button style: px-3 py-1.5 md:px-4 md:py-2 bg-white border border-gray-300 rounded hover:bg-gray-50
- Icon size: w-3 h-3 md:w-4 md:h-4
- Sort dropdown: Absolute positioned menu on click

### Active Filters Display (CONSISTENT ACROSS ALL PAGES)
- Container: bg-gray-50 border-y
- Inner wrapper: px-3 py-3 sm:px-4 flex items-center gap-3 max-w-full
- Label: "Active filters:" - text-sm text-gray-600 font-medium whitespace-nowrap flex-shrink-0
- Filter container: flex-1 overflow-x-auto with flex gap-2 pb-1
- Filter chips: bg-white border border-gray-300 px-3 py-1 rounded-full text-sm
- Remove button: font-bold ml-1 hover:text-gray-900 (×)

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

### Event-Specific Features
#### Event Card Content (EVENTS ONLY)
- Date display with timezone: formatInTimeZone
- Time with state abbreviation from timezone
- Venue and location display
- Recurring event indicator: MdRepeat icon
- No border differentiation for event types

#### Event Filters (EVENTS ONLY)
- Month dropdown: Select current + next 11 months
- Location with radius slider: 1-200km range
- Google Places autocomplete integration
- Filter modal slides from left (same as adverts)

### Thread-Specific Features
#### Thread List Layout (THREADS ONLY)
- Single column layout (Reddit-style, NOT grid)
- Horizontal cards with image on right
- Image sizing: w-20 h-20 sm:w-32 sm:h-24 md:w-40 md:h-28
- Content on left, image on right (flex layout)
- No columns - stack vertically with space-y-3

#### Thread Card Content (THREADS ONLY)
- Title with font-bold
- Question/description with line-clamp-2
- Metadata in single row with bullet separators (•)
- Comment count badge:
  - Active (>0): bg-teal-700 text-lime-100
  - Inactive (0): bg-gray-300 text-gray-700
- Posted by "Former Member" for deleted users

#### Thread Sort Options (THREADS ONLY)
- Newest first
- Oldest first
- Most comments
- Recent activity
- Distance

#### Thread Detail Sections (THREADS ONLY)
1. Topic Details - Basic info grid
2. Topic Description - Main question/content
3. Comments Marked as Useful - Yellow highlighted
4. Discussion - Chat interface

#### Discussion/Chat Interface (THREADS ONLY)
- Message input at top of discussion section
- Messages below in scrollable container (max-h-[500px])
- Current user messages: bg-teal-700 text-lime-100 (right aligned)
- Other users: bg-gray-100 text-gray-800 (left aligned)
- Date separators: bg-gray-200 text-gray-700 rounded-full
- Like/dislike buttons with hover states
- Mute notifications option for logged-in users

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

#### Select/Dropdown (DEPRECATED - Use Enhanced Dropdowns)
- Basic select: Avoid using native select on mobile
- Use enhanced searchable dropdowns instead

#### Enhanced Searchable Dropdowns (REUSABLE)
**CategorySelector Component** - Used across all forms needing category selection
- Location: `/components/shared/CategorySelector.jsx`
- Features:
  - Searchable input with filter icon
  - Clear button (X) to remove selection
  - Visual feedback on open state (border color, rotate chevron)
  - Mobile-friendly with "Close" button at bottom
  - Keyboard accessible
  - Click outside to close
- Styling:
  - Open state: border-teal-500 ring-2 ring-teal-200
  - Selected item: bg-teal-50 text-teal-700 font-medium
  - Hover state: hover:bg-teal-50
- Used in:
  - Advert forms (add/edit)
  - Event forms (add/edit)
  - Thread forms (new/edit)

**TimezoneSelector Component** - Specialized for timezone selection
- Location: `/components/shared/TimezoneSelector.jsx`
- Same features as CategorySelector but for timezone objects
- Accepts array of timezone objects with `{label, value, key}`
- Used in Event forms for timezone selection

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
### Filter Modal (REUSABLE - Used in Adverts, Events, Threads)
- Overlay: fixed inset-0 bg-black bg-opacity-50 z-40
- Mobile: Slides from right (translate-x-full to translate-x-0)
- Desktop: Center overlay with opacity/scale animation
- Container classes: `fixed z-50 bg-white sm:rounded-lg overflow-y-auto w-full inset-y-0 right-0 sm:inset-0 sm:mx-auto sm:max-w-xl sm:top-20 sm:bottom-auto sm:shadow-lg`
- Header: sticky top-0 bg-white border-b with Clear button
- Footer: fixed bottom-0 left-0 right-0 bg-white border-t
- Apply button text: "Show results" (not "Apply filters")

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

## Implementation Guidelines
### Mobile-First Dropdown Selection
- ALWAYS use CategorySelector or similar enhanced dropdowns instead of native select
- Native select elements have poor UX on mobile devices
- Enhanced dropdowns provide:
  - Better touch targets
  - Search functionality
  - Clear visual feedback
  - Consistent cross-platform behavior

### Consistency Requirements
- All list pages (adverts, events, threads) MUST use the same:
  - Filter modal behavior (slides from right on mobile)
  - Page controls layout (centered Filter + Sort buttons)
  - Active filters display with "Active filters:" label
- All form dropdowns MUST use enhanced searchable components

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