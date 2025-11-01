# API Quick Reference - Chunk 2: SOAP Report & Diagnosis

## Base URL
```
http://localhost:8000/api/chatbot/diagnosis/
```

---

## Endpoints

### 1. Generate SOAP Report
```http
POST /api/chatbot/diagnosis/generate
Authorization: Bearer {token}
Content-Type: application/json

{
  "pet_id": 1,
  "symptoms": ["vomiting", "lethargy", "loss of appetite"],
  "duration": "3 days",
  "subjective": "Owner's description of symptoms (optional)",
  "chat_conversation_id": 42
}
```

**Response 201**:
```json
{
  "success": true,
  "case_id": "#PDX-2025-1101-001",
  "soap_report": {
    "case_id": "#PDX-2025-1101-001",
    "pet": {...},
    "owner": {...},
    "subjective": "...",
    "objective": {...},
    "assessment": [...],
    "plan": {...},
    "flag_level": "Urgent",
    "date_generated": "2025-11-01T20:30:00Z"
  }
}
```

---

### 2. Get SOAP Report by Case ID
```http
GET /api/chatbot/diagnosis/soap/%23PDX-2025-1101-001
Authorization: Bearer {token}
```
*Note: URL-encode the # symbol as %23*

**Response 200**:
```json
{
  "success": true,
  "data": {
    "case_id": "#PDX-2025-1101-001",
    "pet": {...},
    "owner": {...},
    "subjective": "...",
    "objective": {...},
    "assessment": [...],
    "plan": {...},
    "flag_level": "Urgent"
  }
}
```

---

### 3. Get All Pet Diagnoses
```http
GET /api/chatbot/diagnosis/1?limit=10&offset=0
Authorization: Bearer {token}
```

**Query Parameters**:
- `limit` (optional, default: 50): Number of results
- `offset` (optional, default: 0): Pagination offset

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "case_id": "#PDX-2025-1101-001",
      "pet_id": 1,
      "pet_name": "Max",
      "owner_name": "John Doe",
      "date_generated": "2025-11-01T20:30:00Z",
      "flag_level": "Urgent",
      "top_condition": "Gastroenteritis",
      "likelihood": 0.85
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 10,
    "offset": 0,
    "count": 10
  }
}
```

---

### 4. Get Flagged Cases for Pet
```http
GET /api/chatbot/diagnosis/flagged/1?flag_level=Emergency
Authorization: Bearer {token}
```

**Query Parameters**:
- `flag_level` (optional): Filter by specific level
  - Options: `Emergency`, `Urgent`, `Moderate`
  - Default: Returns Emergency and Urgent only

**Response 200**:
```json
{
  "success": true,
  "data": [
    {
      "case_id": "#PDX-2025-1101-002",
      "pet_id": 1,
      "pet_name": "Max",
      "owner_name": "John Doe",
      "date_generated": "2025-11-01T18:15:00Z",
      "flag_level": "Emergency",
      "top_condition": "Toxin Ingestion",
      "likelihood": 0.92
    }
  ],
  "count": 1,
  "filter_applied": "Emergency"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "symptoms": ["This field is required"]
  },
  "code": "VALIDATION_ERROR"
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": "You do not have permission to view this report",
  "code": "FORBIDDEN"
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": "Pet with ID 1 not found",
  "code": "PET_NOT_FOUND"
}
```

### 500 Internal Server Error
```json
{
  "success": false,
  "error": "An error occurred while generating the diagnosis",
  "code": "INTERNAL_ERROR",
  "details": "..."
}
```

---

## Flag Levels

### Emergency 🚨
**Criteria**:
- Likelihood ≥ 0.90 AND urgency = 'severe'
- Critical symptoms: seizure, difficulty breathing, severe bleeding, collapse, toxin ingestion, bloat

**Response**:
```
SEEK IMMEDIATE VETERINARY CARE - This is an emergency
```

### Urgent ⚠️
**Criteria**:
- Likelihood ≥ 0.75 AND urgency in ['moderate', 'severe']
- Concerning symptoms with likelihood ≥ 0.60

**Response**:
```
Schedule veterinary appointment within 24-48 hours
```

### Moderate ℹ️
**Criteria**:
- Likelihood ≥ 0.60 (default level)

**Response**:
```
Schedule routine check-up in next few days
```

---

## SOAP Report Structure

### Subjective (S)
Owner's description:
```json
{
  "subjective": "My dog has been vomiting and seems very tired for the past 2 days"
}
```

### Objective (O)
Observable data:
```json
{
  "objective": {
    "symptoms": ["vomiting", "lethargy"],
    "duration": "2 days",
    "image_analysis": {...},
    "ml_confidence": 0.85
  }
}
```

### Assessment (A)
Diagnosis assessments:
```json
{
  "assessment": [
    {
      "condition": "Gastroenteritis",
      "likelihood": 0.85,
      "description": "AI-predicted condition...",
      "matched_symptoms": ["vomiting", "lethargy"],
      "urgency": "Urgent",
      "contagious": false
    }
  ]
}
```

### Plan (P)
Treatment recommendations:
```json
{
  "plan": {
    "severityLevel": "Urgent",
    "careAdvice": [
      "Schedule vet appointment within 24-48 hours",
      "Monitor symptoms closely",
      "..."
    ],
    "aiExplanation": "Based on symptoms...",
    "recommendedActions": ["..."]
  }
}
```

---

## Case ID Format

### Format: `#PDX-YYYY-MMDD-XXX`

**Examples**:
- `#PDX-2025-1101-001` - First case on Nov 1, 2025
- `#PDX-2025-1101-042` - 42nd case on same day

**Features**:
- Unique per day
- Sequential numbering
- Easy to reference
- Human-readable

---

## Testing with cURL

### Generate SOAP Report
```bash
curl -X POST http://localhost:8000/api/chatbot/diagnosis/generate \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "pet_id": 1,
    "symptoms": ["vomiting", "lethargy"],
    "duration": "2 days"
  }'
```

### Get SOAP Report
```bash
curl -X GET "http://localhost:8000/api/chatbot/diagnosis/soap/%23PDX-2025-1101-001" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Pet Diagnoses
```bash
curl -X GET "http://localhost:8000/api/chatbot/diagnosis/1?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Get Flagged Cases
```bash
curl -X GET "http://localhost:8000/api/chatbot/diagnosis/flagged/1?flag_level=Emergency" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Common Workflows

### Workflow 1: Generate Diagnosis from Symptoms
```
1. POST /api/chatbot/diagnosis/generate
   (with pet_id and symptoms)
2. Receive case_id and SOAP report
3. Use case_id to retrieve report later
```

### Workflow 2: View Pet's Medical History
```
1. GET /api/chatbot/diagnosis/{pet_id}
   (with pagination)
2. Review all past diagnoses
3. Click on specific case_id to view details
```

### Workflow 3: Monitor Urgent Cases
```
1. GET /api/chatbot/diagnosis/flagged/{pet_id}
   (filter by Emergency or Urgent)
2. Review flagged cases requiring attention
3. Take appropriate action based on flag level
```

---

## Validation Rules

### Required Fields
- ✅ `pet_id`: Must be a valid pet owned by user
- ✅ `symptoms`: Must be non-empty array of strings

### Optional Fields
- ℹ️ `duration`: String describing symptom duration
- ℹ️ `subjective`: Owner's description (auto-generated if not provided)
- ℹ️ `chat_conversation_id`: Link to conversation
- ℹ️ `image`: Symptom image for analysis

### Symptom Validation
- Must be a list/array
- At least one symptom required
- Symptoms must be non-empty strings
- Empty strings are rejected

---

## Pagination

### Query Parameters
```
?limit=10&offset=0
```

### Response Format
```json
{
  "data": [...],
  "pagination": {
    "total": 50,
    "limit": 10,
    "offset": 0,
    "count": 10
  }
}
```

### Examples
- First page: `?limit=10&offset=0`
- Second page: `?limit=10&offset=10`
- Third page: `?limit=10&offset=20`

---

## Best Practices

### 1. Error Handling
Always check `success` field:
```javascript
if (response.data.success) {
  // Handle success
} else {
  // Handle error using response.data.code
}
```

### 2. URL Encoding
Encode special characters in URLs:
```javascript
const caseId = encodeURIComponent('#PDX-2025-1101-001');
const url = `/api/chatbot/diagnosis/soap/${caseId}`;
```

### 3. Pagination
Implement pagination for large datasets:
```javascript
const limit = 10;
let offset = 0;
while (hasMore) {
  const url = `/api/chatbot/diagnosis/${petId}?limit=${limit}&offset=${offset}`;
  // Fetch and process
  offset += limit;
}
```

### 4. Flag Level Filtering
Use flag_level parameter for targeted queries:
```javascript
// Get only emergency cases
const emergencyUrl = `/api/chatbot/diagnosis/flagged/${petId}?flag_level=Emergency`;

// Get all flagged (Emergency + Urgent)
const flaggedUrl = `/api/chatbot/diagnosis/flagged/${petId}`;
```

---

## Status: ✅ READY FOR PRODUCTION
All endpoints tested and working correctly with best practices implemented.

