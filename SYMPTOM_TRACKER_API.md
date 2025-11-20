# Symptom Tracker API Documentation

## Overview
RESTful API endpoints for logging pet symptoms, tracking progression, calculating risk scores, and managing alerts.

**Base URL:** `/api/chatbot/symptom-tracker/`

**Authentication:** Required (Token/Session)

---

## Endpoints

### 1. Log Symptoms
**Create a new symptom log with automatic risk calculation**

```http
POST /api/chatbot/symptom-tracker/log/
```

**Request Body:**
```json
{
  "pet_id": 1,
  "symptom_date": "2024-11-17",
  "symptoms": ["vomiting", "diarrhea", "lethargy"],
  "overall_severity": "moderate",
  "symptom_details": {
    "vomiting": {
      "count": 3,
      "notes": "After eating"
    }
  },
  "compared_to_yesterday": "worse",
  "notes": "Started this morning"
}
```

**Required Fields:**
- `pet_id` (integer): ID of the pet
- `symptoms` (array of strings): List of symptoms from canonical list
- `overall_severity` (string): One of `mild`, `moderate`, `severe`

**Optional Fields:**
- `symptom_date` (date): Date symptoms occurred (defaults to today)
- `symptom_details` (object): Additional details for specific symptoms
- `compared_to_yesterday` (string): One of `worse`, `same`, `better`, `new`
- `notes` (string): Additional observations

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Symptom log created successfully",
  "symptom_log": {
    "id": 123,
    "pet": 1,
    "pet_name": "Max",
    "pet_animal_type": "dog",
    "logged_date": "2024-11-17T10:30:00Z",
    "symptom_date": "2024-11-17",
    "symptoms": ["vomiting", "diarrhea", "lethargy"],
    "symptom_count": 3,
    "overall_severity": "moderate",
    "symptom_details": {
      "vomiting": {"count": 3, "notes": "After eating"}
    },
    "compared_to_yesterday": "worse",
    "notes": "Started this morning",
    "risk_score": 65,
    "risk_level": "high",
    "risk_level_display": "⚠️ HIGH",
    "days_since_logged": 0
  },
  "risk_assessment": {
    "score": 65,
    "level": "high",
    "recommendation": "⚠️ HIGH PRIORITY: Contact your vet today or visit emergency clinic if after hours.",
    "risk_factors": [
      "Vomiting: 10 points",
      "Diarrhea: 10 points",
      "Moderate symptoms (1.2x multiplier)",
      "Combined GI symptoms (+10 points)",
      "Symptoms worsening (+15 points)"
    ],
    "symptoms_evaluated": 3,
    "total_symptoms_reported": 3
  },
  "alert": {
    "id": 45,
    "pet_id": 1,
    "pet_name": "Max",
    "alert_type": "risk_escalation",
    "alert_type_display": "⬆️ Risk Escalation",
    "alert_message": "⚠️ HIGH PRIORITY: Max's symptoms indicate high risk...",
    "created_at": "2024-11-17T10:30:00Z",
    "time_since_created": "Just now",
    "acknowledged": false
  }
}
```

**Error Responses:**
- `400 Bad Request`: Invalid data or symptoms not in canonical list
- `404 Not Found`: Pet not found or doesn't belong to user

---

### 2. Get Symptom Timeline
**Retrieve symptom history for a pet**

```http
GET /api/chatbot/symptom-tracker/timeline/?pet_id=1&days=30
```

**Query Parameters:**
- `pet_id` (required): Pet ID
- `days` (optional): Number of days to retrieve (default: 30)

**Response (200 OK):**
```json
{
  "pet": {
    "id": 1,
    "name": "Max",
    "animal_type": "dog",
    "age": 5
  },
  "timeline": [
    {
      "id": 120,
      "symptom_date": "2024-11-10",
      "symptoms": ["coughing", "sneezing"],
      "risk_score": 22,
      "risk_level": "low",
      "overall_severity": "mild"
    },
    {
      "id": 123,
      "symptom_date": "2024-11-17",
      "symptoms": ["vomiting", "diarrhea", "lethargy"],
      "risk_score": 65,
      "risk_level": "high",
      "overall_severity": "moderate"
    }
  ],
  "summary": {
    "total_logs": 8,
    "date_range": {
      "start": "2024-10-18",
      "end": "2024-11-17"
    },
    "current_risk_score": 65,
    "current_risk_level": "high",
    "average_risk_score": 38.5,
    "highest_risk_score": 65,
    "days_with_symptoms": 8
  }
}
```

---

### 3. Analyze Symptom Progression
**Get trend analysis and progression patterns**

```http
GET /api/chatbot/symptom-tracker/progression/?pet_id=1
```

**Query Parameters:**
- `pet_id` (required): Pet ID

**Response (200 OK):**
```json
{
  "pet": {
    "id": 1,
    "name": "Max",
    "animal_type": "dog"
  },
  "analysis": {
    "trend": "worsening",
    "trend_description": "Symptoms are worsening (risk increased by 23.5 points)",
    "latest_risk_score": 65,
    "latest_risk_level": "high",
    "average_risk_score": 41.2,
    "highest_risk_score": 65,
    "lowest_risk_score": 18,
    "days_analyzed": 14
  },
  "recurring_symptoms": [
    {"symptom": "vomiting", "frequency": 7},
    {"symptom": "lethargy", "frequency": 5},
    {"symptom": "diarrhea", "frequency": 4}
  ],
  "risk_level_distribution": {
    "low": 5,
    "moderate": 6,
    "high": 2,
    "critical": 1
  },
  "risk_score_timeline": [
    {
      "date": "2024-11-10",
      "risk_score": 22,
      "risk_level": "low"
    },
    {
      "date": "2024-11-17",
      "risk_score": 65,
      "risk_level": "high"
    }
  ],
  "detailed_logs": [...]
}
```

**Trend Values:**
- `improving`: Risk decreasing over time
- `stable`: Risk relatively constant
- `worsening`: Risk increasing over time
- `insufficient_data`: Need more logs for analysis

---

### 4. Get Alerts
**Retrieve symptom alerts for a pet**

```http
GET /api/chatbot/symptom-tracker/alerts/?pet_id=1&acknowledged=false
```

**Query Parameters:**
- `pet_id` (required): Pet ID
- `acknowledged` (optional): Filter by status (`true`/`false`)

**Response (200 OK):**
```json
{
  "pet": {
    "id": 1,
    "name": "Max"
  },
  "alerts": [
    {
      "id": 45,
      "pet_id": 1,
      "pet_name": "Max",
      "symptom_log_id": 123,
      "symptom_date": "2024-11-17",
      "alert_type": "rapid_deterioration",
      "alert_type_display": "⚠️ Rapid Deterioration",
      "alert_message": "⚠️ ALERT: Max's condition is rapidly deteriorating...",
      "created_at": "2024-11-17T10:30:00Z",
      "time_since_created": "2 hours ago",
      "acknowledged": false,
      "acknowledged_at": null
    }
  ],
  "count": 1,
  "unacknowledged_count": 1
}
```

**Alert Types:**
- `rapid_deterioration`: Risk increased ≥20 points in 24h
- `new_critical_symptom`: New critical symptom detected
- `prolonged_symptoms`: Symptoms persisting ≥7 days
- `risk_escalation`: High/critical risk level reached

---

### 5. Acknowledge Alert
**Mark an alert as acknowledged**

```http
POST /api/chatbot/symptom-tracker/{alert_id}/acknowledge-alert/
```

**Path Parameters:**
- `alert_id`: ID of the alert to acknowledge

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Alert acknowledged successfully",
  "alert": {
    "id": 45,
    "acknowledged": true,
    "acknowledged_at": "2024-11-17T12:30:00Z"
  }
}
```

---

### 6. Acknowledge All Alerts
**Acknowledge all unacknowledged alerts for a pet**

```http
POST /api/chatbot/symptom-tracker/acknowledge-all-alerts/
```

**Request Body:**
```json
{
  "pet_id": 1
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Acknowledged 3 alert(s)",
  "acknowledged_count": 3
}
```

---

### 7. Multi-Pet Dashboard
**Get overview of all pets' symptom status**

```http
GET /api/chatbot/symptom-tracker/dashboard/
```

**Response (200 OK):**
```json
{
  "pets": [
    {
      "pet_id": 1,
      "pet_name": "Max",
      "animal_type": "dog",
      "age": 5,
      "has_recent_activity": true,
      "active_alerts": 2,
      "logs_last_7_days": 4,
      "last_logged_date": "2024-11-17",
      "days_since_last_log": 0,
      "current_risk_score": 65,
      "current_risk_level": "high",
      "current_symptoms": ["vomiting", "diarrhea", "lethargy"],
      "severity": "moderate"
    },
    {
      "pet_id": 2,
      "pet_name": "Whiskers",
      "animal_type": "cat",
      "age": 3,
      "has_recent_activity": false,
      "active_alerts": 0,
      "logs_last_7_days": 0
    }
  ],
  "summary": {
    "total_pets": 2,
    "pets_with_symptom_logs": 1,
    "total_active_alerts": 2,
    "critical_risk_pets": 0,
    "high_risk_pets": 1,
    "needs_attention": 1
  }
}
```

---

### 8. Get Canonical Symptoms
**Retrieve the list of valid symptoms**

```http
GET /api/chatbot/symptom-tracker/canonical-symptoms/
```

**Response (200 OK):**
```json
{
  "total_symptoms": 81,
  "symptoms_by_category": {
    "General": [
      "vomiting", "diarrhea", "lethargy", "loss_of_appetite", 
      "weight_loss", "fever", "dehydration", "weakness", "seizures"
    ],
    "Respiratory": [
      "coughing", "sneezing", "wheezing", "labored_breathing",
      "difficulty_breathing", "nasal_discharge", "nasal_congestion",
      "respiratory_distress"
    ],
    "Skin & Coat": [...],
    "Eyes & Ears": [...],
    "Digestive": [...],
    "Urinary": [...],
    "Oral/Dental": [...],
    "Behavioral": [...],
    "Mobility": [...],
    "Bird-Specific": [...],
    "Fish-Specific": [...],
    "Rabbit-Specific": [...],
    "Small Mammal": [...]
  },
  "all_symptoms": [
    "aggression", "bad_breath", "bald_patches", ...
  ]
}
```

---

## Risk Scoring System

### Risk Levels
| Level | Score Range | Recommendation |
|-------|-------------|----------------|
| **Low** | 0-29 | 👁️ Monitor, contact vet if worsens/persists 3-5 days |
| **Moderate** | 30-49 | 📋 Schedule appointment within 24-48 hours |
| **High** | 50-69 | ⚠️ Contact vet today or emergency clinic |
| **Critical** | 70-100 | 🚨 Seek emergency care immediately |

### Risk Calculation Factors
1. **Symptom Severity** - Individual symptom weights
2. **Severity Multiplier** - Mild (1.0x), Moderate (1.2x), Severe (1.5x)
3. **Symptom Combinations** - Synergistic risks
4. **Progression** - Worsening/prolonged symptoms
5. **Onset Speed** - Sudden vs gradual
6. **Pet Factors** - Age, species-specific risks

### Critical Symptoms (Highest Weights)
- `seizures`: 30 points
- `paralysis`: 30 points
- `respiratory_distress`: 28 points
- `difficulty_breathing`: 25 points
- `bloating`: 25 points (GDV risk)
- `straining_to_urinate`: 22 points (blockage)

---

## Usage Examples

### Example 1: Log Daily Symptoms
```javascript
const logSymptoms = async () => {
  const response = await fetch('/api/chatbot/symptom-tracker/log/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Token YOUR_TOKEN'
    },
    body: JSON.stringify({
      pet_id: 1,
      symptoms: ['vomiting', 'lethargy'],
      overall_severity: 'moderate',
      symptom_details: {
        vomiting: { count: 2, notes: 'In the morning' }
      },
      compared_to_yesterday: 'same',
      notes: 'Still not eating much'
    })
  });
  
  const data = await response.json();
  console.log('Risk Score:', data.risk_assessment.score);
  console.log('Recommendation:', data.risk_assessment.recommendation);
  
  if (data.alert) {
    console.log('Alert:', data.alert.alert_message);
  }
};
```

### Example 2: Check Symptom Progression
```javascript
const checkProgression = async (petId) => {
  const response = await fetch(
    `/api/chatbot/symptom-tracker/progression/?pet_id=${petId}`,
    {
      headers: { 'Authorization': 'Token YOUR_TOKEN' }
    }
  );
  
  const data = await response.json();
  console.log('Trend:', data.analysis.trend);
  console.log('Latest Risk:', data.analysis.latest_risk_level);
  console.log('Most Common Symptoms:', data.recurring_symptoms);
};
```

### Example 3: Dashboard Widget
```javascript
const getDashboard = async () => {
  const response = await fetch('/api/chatbot/symptom-tracker/dashboard/', {
    headers: { 'Authorization': 'Token YOUR_TOKEN' }
  });
  
  const data = await response.json();
  
  // Display pets needing attention
  const needsAttention = data.pets.filter(
    pet => pet.current_risk_level === 'high' || 
           pet.current_risk_level === 'critical'
  );
  
  console.log('Pets needing attention:', needsAttention.length);
  console.log('Total active alerts:', data.summary.total_active_alerts);
};
```

---

## Error Handling

### Common Error Responses

**400 Bad Request**
```json
{
  "error": "Invalid data",
  "details": {
    "symptoms": [
      "Invalid symptoms: cough, sneeze. Must be from the canonical symptom list."
    ]
  }
}
```

**404 Not Found**
```json
{
  "error": "Pet not found or does not belong to you"
}
```

**401 Unauthorized**
```json
{
  "detail": "Authentication credentials were not provided."
}
```

---

## Frontend Integration Checklist

- [ ] Fetch canonical symptoms on component mount
- [ ] Validate symptoms against canonical list before submission
- [ ] Display risk score with appropriate color coding
- [ ] Show risk factors and recommendations
- [ ] Implement alert notifications
- [ ] Create timeline/chart visualization
- [ ] Add progression trend indicators
- [ ] Enable alert acknowledgment
- [ ] Build multi-pet dashboard view
- [ ] Add symptom autocomplete/dropdown

---

## Notes

1. **Symptom Validation**: All symptoms must be from the canonical list (81 total). Use the `/canonical-symptoms/` endpoint to get the valid list.

2. **Date Handling**: 
   - `symptom_date`: Date symptoms were observed
   - `logged_date`: Timestamp when log was created
   - Always in user's timezone

3. **Risk Calculation**: Automatic on creation, considers:
   - Previous 14 days of logs
   - Pet age and species
   - Symptom combinations
   - Progression patterns

4. **Alerts**: Automatically created for:
   - Critical risk levels (≥70)
   - Rapid deterioration (±20 in 24h)
   - New critical symptoms
   - Prolonged symptoms (≥7 days)

5. **Performance**: 
   - Timeline endpoint is paginated by date range
   - Dashboard optimized with select_related
   - Progression limited to last 14 days

---

## Testing

Test with cURL:

```bash
# Log symptoms
curl -X POST http://localhost:8000/api/chatbot/symptom-tracker/log/ \
  -H "Authorization: Token YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pet_id": 1,
    "symptoms": ["vomiting", "lethargy"],
    "overall_severity": "moderate"
  }'

# Get timeline
curl http://localhost:8000/api/chatbot/symptom-tracker/timeline/?pet_id=1 \
  -H "Authorization: Token YOUR_TOKEN"

# Get alerts
curl http://localhost:8000/api/chatbot/symptom-tracker/alerts/?pet_id=1 \
  -H "Authorization: Token YOUR_TOKEN"
```

---

**Version:** 1.0  
**Last Updated:** 2024-11-17  
**Maintained by:** PawPal Development Team
