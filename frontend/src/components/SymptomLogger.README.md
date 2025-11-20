# SymptomLogger Component - Usage Guide

## Overview
A comprehensive React component for daily symptom logging with automatic risk assessment using **81 canonical symptoms** from the PawPal disease classifier.

## Features

- ✅ **81 Canonical Symptoms** organized by 9 main categories
- ✅ **Species-Specific Symptoms** for birds, fish, rabbits, hamsters
- ✅ **Search & Filter** symptoms in real-time
- ✅ **Collapsible Categories** for better navigation
- ✅ **Symptom Details** - Add notes for each symptom
- ✅ **Severity Selection** with visual indicators
- ✅ **Progression Tracking** - Compare to yesterday
- ✅ **Automatic Risk Scoring** via backend API
- ✅ **Real-time Alerts** for critical conditions
- ✅ **Beautiful UI** with smooth animations
- ✅ **Fully Responsive** - mobile optimized

## Installation

```bash
# Copy component files
cp SymptomLogger.jsx src/components/
cp SymptomLogger.css src/components/

# Install dependencies
npm install axios
```

## Basic Usage

```jsx
import React from 'react';
import SymptomLogger from './components/SymptomLogger';

function MyPage() {
  const pet = {
    id: 1,
    name: "Max",
    animal_type: "dog"
  };

  const handleComplete = (response) => {
    console.log('Risk Level:', response.risk_assessment.level);
    // Navigate, show notification, etc.
  };

  return <SymptomLogger pet={pet} onComplete={handleComplete} />;
}
```

## Props

### `pet` (required)
```typescript
{
  id: number;              // Pet ID
  name: string;            // Pet's name  
  animal_type: string;     // 'dog', 'cat', 'bird', 'fish', etc.
  age?: number;            // Optional
}
```

### `onComplete` (optional)
```typescript
onComplete?: (response: {
  symptom_log: { id, symptoms, risk_score, risk_level, ... };
  risk_assessment: { score, level, recommendation, risk_factors, ... };
  alert?: { id, alert_type, alert_message, ... };
}) => void;
```

## API Configuration

Component calls: `POST /api/chatbot/symptom-tracker/log/`

Set auth token:
```javascript
localStorage.setItem('token', 'YOUR_TOKEN');
```

## Risk Levels

| Level | Score | Color | Action |
|-------|-------|-------|--------|
| Low | 0-29 | 🟢 Green | Monitor |
| Moderate | 30-49 | 🟡 Yellow | Schedule vet |
| High | 50-69 | 🟠 Orange | Contact vet today |
| Critical | 70-100 | 🔴 Red | Emergency care |

## Symptom Categories (81 Total)

1. **General** (9): vomiting, diarrhea, lethargy, etc.
2. **Respiratory** (8): coughing, sneezing, difficulty_breathing, etc.
3. **Skin & Coat** (10): scratching, hair_loss, rash, etc.
4. **Eyes & Ears** (7): watery_eyes, eye_discharge, etc.
5. **Digestive** (5): constipation, bloating, gas, etc.
6. **Urinary** (5): blood_in_urine, frequent_urination, etc.
7. **Oral & Dental** (6): bad_breath, swollen_gums, etc.
8. **Behavioral** (5): aggression, hiding, confusion, etc.
9. **Mobility** (6): limping, paralysis, stiffness, etc.

**Species-Specific:**
- Birds: drooping_wing, tail_bobbing, etc.
- Fish: swimming_upside_down, fin_rot, etc.
- Rabbits: head_tilt, rolling, etc.
- Small Mammals: wet_tail, overgrown_teeth, etc.

## Example Integrations

### With React Router
```jsx
import { useNavigate } from 'react-router-dom';

function SymptomPage() {
  const navigate = useNavigate();
  
  const handleComplete = (response) => {
    if (response.risk_assessment.level === 'critical') {
      alert('🚨 URGENT: ' + response.risk_assessment.recommendation);
    }
    navigate(`/pets/${pet.id}/timeline`);
  };

  return <SymptomLogger pet={pet} onComplete={handleComplete} />;
}
```

### In a Modal
```jsx
import { Dialog } from '@mui/material';

function Dashboard() {
  const [open, setOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setOpen(true)}>Log Symptoms</button>
      <Dialog open={open} onClose={() => setOpen(false)}>
        <SymptomLogger 
          pet={selectedPet} 
          onComplete={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
```

### With State Management (Redux)
```jsx
import { useDispatch } from 'react-redux';
import { addSymptomLog, showNotification } from './store/actions';

function SymptomPage() {
  const dispatch = useDispatch();
  
  const handleComplete = (response) => {
    // Update Redux store
    dispatch(addSymptomLog(response.symptom_log));
    
    // Show notification
    dispatch(showNotification({
      type: response.risk_assessment.level,
      message: response.risk_assessment.recommendation
    }));
  };

  return <SymptomLogger pet={pet} onComplete={handleComplete} />;
}
```

## Customization

### Change API Endpoint
```jsx
// In SymptomLogger.jsx, line ~150
const API_URL = process.env.REACT_APP_API_URL || '/api/chatbot';
const response = await axios.post(`${API_URL}/symptom-tracker/log/`, { ... });
```

### Override Styles
```css
/* your-styles.css */
.symptom-logger {
  max-width: 1200px;
}

.risk-level-card.risk-critical {
  background: linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%);
}
```

### Add Analytics
```jsx
const handleComplete = (response) => {
  // Track event
  gtag('event', 'symptom_logged', {
    pet_id: pet.id,
    risk_level: response.risk_assessment.level,
    symptom_count: response.symptom_log.symptoms.length
  });
  
  // Continue with other actions
  onComplete(response);
};
```

## Troubleshooting

### Symptoms not validating
- Ensure symptoms match canonical list exactly (use underscores, lowercase)
- Check API response for validation errors

### Auth errors (401)
- Verify token is set: `localStorage.getItem('token')`
- Check Authorization header format: `Token ${token}`

### Risk score always 0
- Verify backend `calculate_risk_score()` is called
- Check that previous logs are passed correctly

### Species-specific symptoms not showing
- Ensure `pet.animal_type` matches: 'bird', 'fish', 'rabbit', 'hamster'
- Check console for mapping errors

## Browser Support

- ✅ Chrome 90+
- ✅ Firefox 88+
- ✅ Safari 14+
- ✅ Edge 90+
- ✅ Mobile browsers

## Performance Tips

1. **Lazy Load** - Load component only when needed
2. **Memoize** - Use `React.memo` for pet prop
3. **Debounce Search** - Add debounce to search input
4. **Optimize Re-renders** - Use `useCallback` for handlers

## Accessibility

- ✅ Keyboard navigation supported
- ✅ ARIA labels on form controls
- ✅ Focus management
- ✅ Screen reader compatible
- ✅ Color contrast WCAG AA compliant

## License

MIT - Part of PawPal project

## Support

- API Docs: `SYMPTOM_TRACKER_API.md`
- Backend Docs: `RISK_SCORING_DOCUMENTATION.md`
- Issues: Contact development team
