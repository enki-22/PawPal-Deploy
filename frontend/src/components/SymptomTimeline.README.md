# SymptomTimeline Component - Documentation

## Overview
A comprehensive React component for visualizing pet symptom progression over time with charts, trend analysis, alerts, and detailed history.

## Features

- ✅ **Interactive Chart** - Risk scores plotted over time with reference lines
- ✅ **Trend Analysis** - Improving/Worsening/Stable indicators
- ✅ **Active Alerts** - Display critical warnings with acknowledgment
- ✅ **Summary Stats** - Total logs, current/average/highest risk
- ✅ **Recurring Symptoms** - Most common symptoms identified
- ✅ **Risk Distribution** - Visual breakdown by risk level
- ✅ **Detailed History** - Expandable timeline entries
- ✅ **Date Range Filter** - 7/14/30/60/90 day views
- ✅ **Responsive Design** - Mobile optimized
- ✅ **Print Support** - Clean printable layout

## Installation

```bash
# Install dependencies
npm install recharts axios

# Copy component files
cp SymptomTimeline.jsx src/components/
cp SymptomTimeline.css src/components/
```

## Basic Usage

```jsx
import React from 'react';
import SymptomTimeline from './components/SymptomTimeline';

function PetTimelinePage() {
  const petId = 1;
  const pet = {
    id: 1,
    name: "Max",
    animal_type: "dog"
  };

  return (
    <div className="container">
      <SymptomTimeline petId={petId} pet={pet} />
    </div>
  );
}
```

## Props

### `petId` (required)
```typescript
petId: number
```
The ID of the pet whose timeline to display.

### `pet` (optional)
```typescript
pet?: {
  id: number;
  name: string;
  animal_type: string;
}
```
Pet object for displaying name and type in header. If not provided, header shows less info.

## API Integration

Component fetches data from three endpoints:

### 1. Timeline Data
```
GET /api/chatbot/symptom-tracker/timeline/?pet_id={petId}&days={dateRange}
```

### 2. Alerts Data
```
GET /api/chatbot/symptom-tracker/alerts/?pet_id={petId}&acknowledged=false
```

### 3. Progression Data
```
GET /api/chatbot/symptom-tracker/progression/?pet_id={petId}
```

## Component Sections

### 1. Header
- Pet name and animal type
- Date range selector (7/14/30/60/90 days)
- Refresh button

### 2. Active Alerts (if any)
- Alert cards with type icon and message
- Individual acknowledge buttons
- "Acknowledge All" option for multiple alerts

### 3. Summary Cards
- Total Logs
- Current Risk (with color-coded score)
- Average Risk
- Highest Risk

### 4. Progression Analysis
- **Trend Indicator:** Improving/Worsening/Stable with icon
- **Latest/Average/Range Stats**
- **Most Common Symptoms:** Top 8 recurring symptoms
- **Risk Distribution:** Visual bars showing time at each risk level

### 5. Risk Score Chart
- Area chart with risk scores over time
- Reference lines for Critical (70), High (50), Moderate (30)
- Custom tooltip with date, score, level, severity
- Color legend

### 6. Detailed Log History
- Timeline view with visual markers
- Expandable entries with notes
- Shows symptoms, severity, comparison, risk score
- Color-coded by risk level

### 7. Action Buttons
- "Log New Symptoms" - Navigate to symptom logger
- "Print Timeline" - Print-friendly view

## Example Integrations

### With React Router
```jsx
import { useParams } from 'react-router-dom';
import { useState, useEffect } from 'react';

function TimelinePage() {
  const { petId } = useParams();
  const [pet, setPet] = useState(null);

  useEffect(() => {
    // Fetch pet data
    fetch(`/api/pets/${petId}/`)
      .then(res => res.json())
      .then(data => setPet(data));
  }, [petId]);

  return pet ? <SymptomTimeline petId={pet.id} pet={pet} /> : <div>Loading...</div>;
}
```

### As a Tab in Pet Profile
```jsx
import { Tab, Tabs } from '@mui/material';

function PetProfile({ pet }) {
  const [tab, setTab] = useState(0);

  return (
    <>
      <Tabs value={tab} onChange={(e, v) => setTab(v)}>
        <Tab label="Overview" />
        <Tab label="Symptoms" />
        <Tab label="Medical Records" />
      </Tabs>

      {tab === 1 && <SymptomTimeline petId={pet.id} pet={pet} />}
    </>
  );
}
```

### With Redux
```jsx
import { useDispatch, useSelector } from 'react-redux';

function TimelineContainer({ petId }) {
  const dispatch = useDispatch();
  const pet = useSelector(state => 
    state.pets.items.find(p => p.id === petId)
  );

  return <SymptomTimeline petId={petId} pet={pet} />;
}
```

## Customization

### Change Chart Colors
```jsx
// In SymptomTimeline.jsx
<Area
  type="monotone"
  dataKey="risk_score"
  stroke="#9b59b6"  // Change line color
  fill="url(#colorRisk)"
/>
```

### Modify Risk Thresholds
```jsx
// Change reference lines
<ReferenceLine y={75} stroke="#e74c3c" label="Critical" />  // From 70
<ReferenceLine y={55} stroke="#f39c12" label="High" />      // From 50
```

### Override Styles
```css
/* custom.css */
.symptom-timeline {
  max-width: 1400px;  /* Wider layout */
}

.chart-container {
  background: #f5f5f5;  /* Different background */
}
```

## State Management

Component manages the following state:

```typescript
{
  timeline: Array<SymptomLog>;        // Timeline entries
  alerts: Array<SymptomAlert>;        // Unacknowledged alerts
  progression: ProgressionData;       // Trend analysis
  summary: TimelineSummary;           // Summary stats
  loading: boolean;                   // Loading state
  error: string | null;               // Error message
  dateRange: number;                  // Days to display
  selectedLog: number | null;         // Expanded log ID
}
```

## Loading States

### Initial Load
Shows spinner with "Loading symptom timeline..." message.

### Error State
Shows error message with "Try Again" button.

### Empty State
Shows when no symptom logs exist with "Log Symptoms" call-to-action.

## Alert Management

### Acknowledge Single Alert
```javascript
const acknowledgeAlert = async (alertId) => {
  await axios.post(
    `/api/chatbot/symptom-tracker/${alertId}/acknowledge-alert/`,
    {},
    { headers: { Authorization: `Token ${token}` } }
  );
  // Remove from list
};
```

### Acknowledge All Alerts
```javascript
const acknowledgeAllAlerts = async () => {
  await axios.post(
    '/api/chatbot/symptom-tracker/acknowledge-all-alerts/',
    { pet_id: petId },
    { headers: { Authorization: `Token ${token}` } }
  );
  // Clear alerts
};
```

## Performance Tips

1. **Lazy Load** - Load component only when tab is active
2. **Memoize** - Use `React.memo` for pet prop
3. **Debounce** - Add debounce to date range changes
4. **Cache Data** - Cache API responses for 5 minutes

## Responsive Breakpoints

```css
Desktop:  > 968px  (full layout)
Tablet:   ≤ 968px  (stacked progression)
Mobile:   ≤ 768px  (vertical timeline)
Small:    ≤ 480px  (simplified view)
```

## Accessibility

- ✅ Keyboard navigation
- ✅ ARIA labels on interactive elements
- ✅ Focus management
- ✅ Screen reader friendly
- ✅ Color contrast WCAG AA

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

## Troubleshooting

### Chart not displaying
```javascript
// Ensure recharts is installed
npm install recharts

// Check data format
console.log(chartData);
```

### Alerts not showing
```javascript
// Check filter parameter
const url = `/alerts/?pet_id=${petId}&acknowledged=false`;

// Verify token
console.log(localStorage.getItem('token'));
```

### Timeline empty despite logs
```javascript
// Check API response
console.log(timelineRes.data);

// Verify date range
console.log(`Fetching ${dateRange} days of data`);
```

## Testing

```jsx
import { render, screen, waitFor } from '@testing-library/react';
import SymptomTimeline from './SymptomTimeline';
import axios from 'axios';

jest.mock('axios');

test('displays timeline data', async () => {
  axios.get.mockResolvedValue({
    data: {
      timeline: [/* mock data */],
      summary: {/* mock summary */}
    }
  });

  render(<SymptomTimeline petId={1} />);

  await waitFor(() => {
    expect(screen.getByText('Symptom Timeline')).toBeInTheDocument();
  });
});
```

## Future Enhancements

- [ ] Export timeline as PDF
- [ ] Share timeline with vet
- [ ] Compare multiple pets
- [ ] Symptom correlations
- [ ] Weather/diet overlays
- [ ] Photo attachments in timeline
- [ ] Voice notes integration

## Related Components

- **SymptomLogger** - Log daily symptoms
- **SymptomDashboard** - Multi-pet overview
- **AlertManager** - Manage all alerts

## Support

- **API Docs:** `SYMPTOM_TRACKER_API.md`
- **Component Docs:** `SYMPTOM_LOGGER_COMPONENT.md`
- **Risk System:** `RISK_SCORING_DOCUMENTATION.md`

## License

MIT - Part of PawPal project
