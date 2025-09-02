# EventCapacityDisplay Component Usage

## Updated Props

```jsx
<EventCapacityDisplay 
  eventId={string}              // Required: Event ID
  isPaid={boolean}              // Event type (default: false)
  context={'viewing'|'purchasing'} // Display context (default: 'viewing')
  onCapacityUpdate={function}   // Callback when capacity changes
  refreshInterval={number}      // Custom refresh interval in ms
  maxPerRegistration={number}   // Max attendees per registration
  showInTicketSection={boolean} // Legacy prop for backward compatibility
/>
```

## Usage Examples

### 1. Views Page (SingleEventCard.jsx)
```jsx
// Shows conservative "sold only" counts
<EventCapacityDisplay 
  eventId={event._id} 
  isPaid={event.isPaid}
  context="viewing"
  maxPerRegistration={event.maxAttendeesPerRegistration}
/>
```

### 2. Tickets Page (TicketSelectionPage.jsx)
```jsx
// Shows real-time availability with reservations
function TicketSelectionPage() {
  const [capacity, setCapacity] = useState(null);
  
  const handleCapacityUpdate = (newCapacity) => {
    // Check if need to adjust quantities
    if (newCapacity.available < currentQuantity) {
      adjustQuantity(newCapacity.available);
    }
  };
  
  return (
    <EventCapacityDisplay 
      eventId={eventId}
      isPaid={true}
      context="purchasing"
      onCapacityUpdate={handleCapacityUpdate}
      refreshInterval={5000} // 5 second refresh
    />
  );
}
```

## Display Differences by Context

### Viewing Context (Views Page)
- Shows: "80 of 100 sold"
- Updates: Every 60 seconds (paid) or 30 seconds (free)
- Focus: Conservative display for browsing

### Purchasing Context (Tickets Page)
- Shows: "5 spots available" 
- Shows: "You have 2 tickets reserved"
- Shows: "3 other users are currently booking"
- Updates: Every 10 seconds (or custom interval)
- Focus: Real-time accuracy for purchasing

## Backend Response Differences

### GET /api/events/123/capacity/v2?context=viewing
```json
{
  "capacity": {
    "total": 100,
    "sold": 80,
    "displayText": "80 of 100 sold",
    "status": "available"
  }
}
```

### GET /api/events/123/capacity/v2?context=purchasing
```json
{
  "capacity": {
    "total": 100,
    "sold": 80,
    "reserved": 15,
    "available": 5,
    "userReservation": 2,
    "canBook": 7,
    "activeReservations": 3,
    "status": "limited"
  }
}
```