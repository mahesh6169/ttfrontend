# Community/Language Feature Implementation Guide

## Overview
This guide documents the implementation of the Community/Language feature for content filtering and targeting across the platform (adverts, events, threads).

## Available Communities/Languages
```javascript
const COMMUNITIES = [
  { value: 'telugu', label: 'Telugu' },
  { value: 'tamil', label: 'Tamil' },
  { value: 'kannada', label: 'Kannada' },
  { value: 'malayalam', label: 'Malayalam' },
  { value: 'hindi', label: 'Hindi' },
  { value: 'punjabi', label: 'Punjabi' }
];
```

## Core Concepts
1. **Default Behavior**: No communities selected = content visible to everyone
2. **Targeted Visibility**: Select specific communities to limit visibility
3. **Filter Logic**: When filtering, users see content tagged with selected communities OR untagged content

## Backend Implementation

### 1. Schema Update
Add communities field to your model:
```javascript
communities: [{
  type: String,
  trim: true,
  lowercase: true
}]
```

### 2. Add Index
```javascript
schema.index({ communities: 1 });
```

### 3. Controller Updates

#### Create/Update Validation
```javascript
// Import community values
import { COMMUNITY_VALUES } from '../../utils/constants/communities.js';

// Parse communities
const parsedCommunities = communities ? 
  (typeof communities === 'string' ? JSON.parse(communities) : communities) : [];

// Validate communities
if (parsedCommunities.length > 0) {
  const invalidCommunities = parsedCommunities.filter(c => !COMMUNITY_VALUES.includes(c));
  if (invalidCommunities.length > 0) {
    return sendValidationError(res, [`Invalid communities: ${invalidCommunities.join(', ')}`]);
  }
}

// Add to create/update data
const data = {
  // ... other fields
  communities: parsedCommunities
};
```

#### Search/Filter Logic
```javascript
// In search controller
if (parsedFilters.communities && parsedFilters.communities.length > 0) {
  pipeline.push({
    $match: {
      communities: { $in: parsedFilters.communities }
    }
  });
}
```

## Frontend Implementation

### 1. Form Component (Add/Edit)

#### Import and Setup
```javascript
import CommunitySelector from '@/components/shared/CommunitySelector';

// In initial state
const [formData, setFormData] = useState({
  // ... other fields
  communities: []
});
```

#### In Form JSX
```jsx
<CommunitySelector
  value={formData.communities}
  onChange={(value) => handleChange('communities', value)}
  label="Community/Language"
/>
```

#### Form Submission
```javascript
// In submit data
const submitData = {
  // ... other fields
  communities: formData.communities
};

// When creating FormData for API
const jsonKeys = ['fields', 'pricing', 'address', 'communities'];
```

### 2. Listing Page (Filter Implementation)

#### Redux State
```javascript
// In searchSlice initial state
filters: {
  categories: [],
  communities: [],
  // ... other filters
}

// Add toggle action
toggleCommunity: (state, action) => {
  const community = action.payload;
  const index = state.filters.communities.indexOf(community);
  
  if (index > -1) {
    state.filters.communities.splice(index, 1);
  } else {
    state.filters.communities.push(community);
  }
  state.pagination.page = 1;
}
```

#### Filter UI (Compact 2-Column Layout)
```jsx
<div className="mb-4">
  <h3 className="font-semibold text-gray-700 mb-3">Community/Language</h3>
  <div className="max-h-32 overflow-y-auto border border-gray-200 rounded-md p-2">
    <div className="grid grid-cols-2 gap-1">
      {COMMUNITIES.map((community) => (
        <label
          key={community.value}
          className="flex items-center cursor-pointer hover:bg-gray-50 p-2 rounded transition-colors"
        >
          <input
            type="checkbox"
            checked={tempFilters.communities?.includes(community.value) || false}
            onChange={() => {
              const currentCommunities = tempFilters.communities || [];
              const newCommunities = currentCommunities.includes(community.value)
                ? currentCommunities.filter(c => c !== community.value)
                : [...currentCommunities, community.value];
              setTempFilters({ ...tempFilters, communities: newCommunities });
            }}
            className="w-4 h-4 text-teal-600 rounded focus:ring-teal-500 focus:ring-2 transition-all"
          />
          <span className="ml-2 text-sm text-gray-700">{community.label}</span>
        </label>
      ))}
    </div>
  </div>
  {tempFilters.communities?.length > 0 && (
    <p className="text-xs text-gray-600 mt-1">
      {tempFilters.communities.length} selected
    </p>
  )}
</div>
```

#### Active Filter Display
```jsx
{filters.communities.map((community) => {
  const communityLabel = COMMUNITIES.find(c => c.value === community)?.label || community;
  return (
    <span
      key={community}
      className="inline-flex items-center gap-1 bg-white border border-gray-300 text-gray-700 px-3 py-1 rounded-full text-sm whitespace-nowrap flex-shrink-0"
    >
      {communityLabel}
      <button
        onClick={() => dispatch(toggleCommunity(community))}
        className="hover:text-gray-900 font-bold ml-1"
      >
        ×
      </button>
    </span>
  );
})}
```

### 3. Shared CommunitySelector Component
Located at: `/components/shared/CommunitySelector.jsx`

Features:
- Multi-select checkboxes
- Customizable label and error display
- Controlled component pattern
- No "All" option (empty = visible to all)

## UI/UX Guidelines

### Posting Content
- Label: "Community/Language"
- Default: No selection (visible to everyone)
- Layout: Vertical list or 2-column grid for compact display
- Helper text: Not needed (intuitive that no selection = all)

### Filtering Content
- Same label and layout as posting
- Default: No filter applied (see all content)
- Active filters shown as removable chips
- Include in filter count

### Mobile Considerations
- 2-column grid works well on mobile
- Scrollable container with max-height
- Touch-friendly checkbox targets

## Implementation Checklist

### Backend
- [ ] Add communities field to schema
- [ ] Add database index
- [ ] Update create controller with validation
- [ ] Update edit controller with validation
- [ ] Add community filter to search controller

### Frontend
- [ ] Create/import CommunitySelector component
- [ ] Add to form state and submission
- [ ] Add to Redux filter state
- [ ] Implement filter UI in listing page
- [ ] Display active community filters
- [ ] Update filter count logic

### Testing
- [ ] Create content with no communities (visible to all)
- [ ] Create content with specific communities
- [ ] Filter by single community
- [ ] Filter by multiple communities
- [ ] Clear community filters
- [ ] Edit content to change communities

## Notes
- Communities are stored lowercase in database
- Empty communities array = visible to everyone
- No "All" option needed - simplifies mental model
- Consistent implementation across adverts, events, threads