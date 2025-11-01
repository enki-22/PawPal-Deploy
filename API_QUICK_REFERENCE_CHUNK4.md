# Chunk 4: Admin Dashboard - API Quick Reference

## 🚀 Quick Start

**Base URL**: `http://localhost:8000/api/admin/dashboard`  
**Authentication**: JWT Bearer Token (from Chunk 3)  
**Permissions**: MASTER, VET, DESK (all admin roles)  
**Format**: JSON

---

## 📋 Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/stats` | Dashboard statistics with filters |
| GET | `/recent-pets` | Last 5 registered pets |
| GET | `/flagged-cases` | Filtered SOAP reports by urgency |
| GET | `/charts` | Chart data for visualizations |
| GET | `/faqs` | FAQ list for dashboard |
| GET | `/announcements` | Active announcements (2-3) |

---

## 📊 1. Dashboard Stats

### GET `/stats`

Get dashboard statistics with optional filters.

**Request:**
```bash
curl -X GET "http://localhost:8000/api/admin/dashboard/stats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**With Filters:**
```bash
curl -X GET "http://localhost:8000/api/admin/dashboard/stats?reports_filter=last_7_days&conversations_filter=this_month" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Query Parameters:**
- `reports_filter`: last_7_days | last_30_days | all_time (default: all_time)
- `conversations_filter`: this_week | this_month | all_time (default: all_time)

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "total_users": 150,
    "total_pets": 230,
    "total_reports": 45,
    "total_conversations": 89,
    "filters_applied": {
      "reports_filter": "last_7_days",
      "conversations_filter": "all_time"
    }
  }
}
```

**Notes:**
- Users and pets counts are always total (no filter)
- Reports can be filtered by time period
- Conversations can be filtered by time period

---

## 🐾 2. Recent Pets

### GET `/recent-pets`

Get last 5 registered pets with owner information.

**Request:**
```bash
curl -X GET "http://localhost:8000/api/admin/dashboard/recent-pets" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "pet_name": "Max",
      "species": "Dog",
      "breed": "Golden Retriever",
      "owner_name": "John Doe",
      "registration_date": "2025-11-01T10:30:00Z"
    },
    {
      "pet_name": "Whiskers",
      "species": "Cat",
      "breed": "Persian",
      "owner_name": "Jane Smith",
      "registration_date": "2025-10-31T15:45:00Z"
    },
    {
      "pet_name": "Tweety",
      "species": "Bird",
      "breed": "Canary",
      "owner_name": "Bob Wilson",
      "registration_date": "2025-10-30T09:15:00Z"
    }
  ]
}
```

**Notes:**
- Always returns max 5 pets
- Ordered by registration_date DESC
- Owner name is formatted (first + last) or username fallback

---

## 🚨 3. Flagged Cases

### GET `/flagged-cases`

Get SOAP reports filtered by flag_level.

**Request:**
```bash
curl -X GET "http://localhost:8000/api/admin/dashboard/flagged-cases" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**With Filter:**
```bash
curl -X GET "http://localhost:8000/api/admin/dashboard/flagged-cases?filter=emergency" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Query Parameters:**
- `filter`: all | emergency | urgent | moderate (default: all)

**Success Response (200):**
```json
{
  "success": true,
  "filter": "emergency",
  "count": 3,
  "data": [
    {
      "case_id": "#PDX-2025-1101-001",
      "pet_name": "Buddy",
      "species": "Dog",
      "condition": "Severe Respiratory Distress",
      "likelihood": 0.95,
      "urgency": "Severe",
      "owner_name": "Alice Johnson",
      "date_flagged": "2025-11-01T14:20:00Z",
      "flag_level": "Emergency"
    },
    {
      "case_id": "#PDX-2025-1101-002",
      "pet_name": "Mittens",
      "species": "Cat",
      "condition": "Suspected Poisoning",
      "likelihood": 0.88,
      "urgency": "Severe",
      "owner_name": "Carol White",
      "date_flagged": "2025-11-01T12:45:00Z",
      "flag_level": "Emergency"
    }
  ]
}
```

**Error Response - Invalid Filter (400):**
```json
{
  "success": false,
  "error": "Invalid filter parameter",
  "valid_filters": ["all", "emergency", "urgent", "moderate"]
}
```

**Ordering:**
- Emergency cases first
- Then Urgent cases
- Then Moderate cases
- Within each level: most recent first

**Notes:**
- Shows top diagnosis from assessment
- Condition, likelihood, urgency from SOAP report
- Useful for triage and prioritization

---

## 📈 4. Dashboard Charts

### GET `/charts`

Get chart data for dashboard visualizations.

**Request:**
```bash
curl -X GET "http://localhost:8000/api/admin/dashboard/charts" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "data": {
    "species_breakdown": {
      "Dogs": 120,
      "Cats": 85,
      "Birds": 15,
      "Rabbits": 8,
      "Others": 2
    },
    "common_symptoms": [
      {"symptom": "Vomiting", "count": 45},
      {"symptom": "Diarrhea", "count": 38},
      {"symptom": "Lethargy", "count": 32},
      {"symptom": "Loss Of Appetite", "count": 28},
      {"symptom": "Coughing", "count": 25},
      {"symptom": "Sneezing", "count": 22},
      {"symptom": "Scratching", "count": 20},
      {"symptom": "Limping", "count": 18},
      {"symptom": "Eye Discharge", "count": 15},
      {"symptom": "Fever", "count": 12}
    ],
    "symptoms_by_species": {
      "Dogs": ["Vomiting", "Diarrhea", "Coughing", "Limping", "Sneezing"],
      "Cats": ["Vomiting", "Lethargy", "Sneezing", "Scratching", "Eye Discharge"],
      "Birds": ["Lethargy", "Loss Of Appetite", "Feather Loss", "Sneezing", "Breathing Issues"],
      "Rabbits": ["Diarrhea", "Loss Of Appetite", "Lethargy", "Sneezing", "Eye Discharge"]
    }
  }
}
```

**Data Breakdown:**

**species_breakdown**:
- Dogs, Cats, Birds, Rabbits, Others
- Counts from Pet database
- Useful for pie/donut charts

**common_symptoms**:
- Top 10 symptoms across all species
- Extracted from SOAP reports
- Useful for bar charts

**symptoms_by_species**:
- Top 5 symptoms per species
- Helps identify species-specific patterns
- Useful for grouped bar charts or tables

---

## ❓ 5. Dashboard FAQs

### GET `/faqs`

Get FAQ list for dashboard display.

**Request:**
```bash
curl -X GET "http://localhost:8000/api/admin/dashboard/faqs" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "question": "What services do you offer?",
      "answer": "PawPal offers AI-powered pet symptom analysis, virtual health consultations, and comprehensive SOAP reports to help you understand your pet's health conditions better."
    },
    {
      "question": "How often should I bring my pet for check-ups?",
      "answer": "For healthy adult pets, annual check-ups are recommended. Puppies, kittens, and senior pets may need more frequent visits (every 6 months). Always consult your veterinarian for personalized advice."
    },
    {
      "question": "Is the AI diagnosis as accurate as a veterinarian?",
      "answer": "Our AI provides preliminary analysis based on symptoms, but it should NOT replace professional veterinary care. Always consult a licensed veterinarian for definitive diagnosis and treatment."
    }
  ]
}
```

**FAQ Topics Covered:**
1. Services offered
2. Check-up frequency  
3. AI vs veterinarian accuracy
4. Information needed for diagnosis
5. Diagnosis speed
6. Emergency situations
7. Reading SOAP reports
8. Emergency flag handling
9. Sharing reports with vets
10. Data protection

**Notes:**
- Currently hardcoded (10 FAQs)
- Can be moved to database later
- Useful for help section in dashboard

---

## 📢 6. Dashboard Announcements

### GET `/announcements`

Get active announcements for dashboard display.

**Request:**
```bash
curl -X GET "http://localhost:8000/api/admin/dashboard/announcements" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "title": "System Maintenance Scheduled",
      "validity": "From 2025-11-01 to 2025-11-03",
      "description": "We will be performing scheduled maintenance on November 2nd from 2:00 AM to 4:00 AM EST. The system may be temporarily unavailable.",
      "type": "Maintenance",
      "target_audience": "All Users"
    },
    {
      "title": "New Feature: Image Analysis",
      "validity": "From 2025-10-28 (No end date)",
      "description": "We've added AI-powered image analysis for visual symptoms. Upload clear photos for better diagnosis!",
      "type": "New Feature",
      "target_audience": "All Users"
    }
  ]
}
```

**Announcement Types:**
- Information
- Warning
- Urgent
- Maintenance
- New Feature

**Target Audiences:**
- All Users
- New Users
- Active Users
- Premium Users

**Notes:**
- Returns max 3 announcements
- Only active (is_active=True)
- Only current (within start_date and end_date)
- Ordered by created_at DESC

---

## 🔒 Authentication & Permissions

### Required Headers
```bash
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### All Endpoints Require:
- Valid JWT token from Chunk 3 login
- Active admin account
- Any admin role (MASTER, VET, or DESK)

### Error Responses

**401 Unauthorized** (No/Invalid Token):
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

**403 Forbidden** (Insufficient Permissions):
```json
{
  "success": false,
  "error": "Insufficient permissions",
  "code": "PERMISSION_DENIED"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Failed to fetch dashboard statistics",
  "details": "Error details here"
}
```

---

## 💻 Complete Dashboard Example

```bash
# 1. Login first
TOKEN=$(curl -s -X POST http://localhost:8000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"vet@pawpal.com","password":"VetAdmin123!"}' \
  | jq -r '.data.token')

echo "Token: $TOKEN"

# 2. Get dashboard stats
curl -X GET "http://localhost:8000/api/admin/dashboard/stats" \
  -H "Authorization: Bearer $TOKEN" | jq

# 3. Get recent pets
curl -X GET "http://localhost:8000/api/admin/dashboard/recent-pets" \
  -H "Authorization: Bearer $TOKEN" | jq

# 4. Get emergency cases
curl -X GET "http://localhost:8000/api/admin/dashboard/flagged-cases?filter=emergency" \
  -H "Authorization: Bearer $TOKEN" | jq

# 5. Get chart data
curl -X GET "http://localhost:8000/api/admin/dashboard/charts" \
  -H "Authorization: Bearer $TOKEN" | jq

# 6. Get FAQs
curl -X GET "http://localhost:8000/api/admin/dashboard/faqs" \
  -H "Authorization: Bearer $TOKEN" | jq

# 7. Get announcements
curl -X GET "http://localhost:8000/api/admin/dashboard/announcements" \
  -H "Authorization: Bearer $TOKEN" | jq
```

---

## 🎨 Frontend Integration Examples

### React Example
```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState({});
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      const token = localStorage.getItem('admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const base = 'http://localhost:8000/api/admin/dashboard';
      
      try {
        // Parallel requests for better performance
        const [stats, pets, cases, charts, faqs, announcements] = await Promise.all([
          axios.get(`${base}/stats`, { headers }),
          axios.get(`${base}/recent-pets`, { headers }),
          axios.get(`${base}/flagged-cases`, { headers }),
          axios.get(`${base}/charts`, { headers }),
          axios.get(`${base}/faqs`, { headers }),
          axios.get(`${base}/announcements`, { headers })
        ]);
        
        setDashboardData({
          stats: stats.data.data,
          pets: pets.data.data,
          cases: cases.data.data,
          charts: charts.data.data,
          faqs: faqs.data.data,
          announcements: announcements.data.data
        });
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
        if (error.response?.status === 401) {
          // Redirect to login
          window.location.href = '/admin/login';
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (loading) return <div>Loading dashboard...</div>;
  
  return (
    <div className="dashboard">
      <StatsCards stats={dashboardData.stats} />
      <RecentPets pets={dashboardData.pets} />
      <FlaggedCases cases={dashboardData.cases} />
      <Charts data={dashboardData.charts} />
      <FAQSection faqs={dashboardData.faqs} />
      <Announcements announcements={dashboardData.announcements} />
    </div>
  );
};
```

### Vue.js Example
```javascript
export default {
  data() {
    return {
      stats: {},
      recentPets: [],
      flaggedCases: [],
      loading: true
    }
  },
  
  async mounted() {
    await this.fetchDashboard();
  },
  
  methods: {
    async fetchDashboard() {
      const token = localStorage.getItem('admin_token');
      const headers = { 'Authorization': `Bearer ${token}` };
      const base = '/api/admin/dashboard';
      
      try {
        const [statsRes, petsRes, casesRes] = await Promise.all([
          this.$http.get(`${base}/stats`, { headers }),
          this.$http.get(`${base}/recent-pets`, { headers }),
          this.$http.get(`${base}/flagged-cases?filter=emergency`, { headers })
        ]);
        
        this.stats = statsRes.data.data;
        this.recentPets = petsRes.data.data;
        this.flaggedCases = casesRes.data.data;
      } catch (error) {
        this.$toast.error('Failed to load dashboard');
      } finally {
        this.loading = false;
      }
    }
  }
}
```

---

## 📊 Response Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid filter parameter |
| 401 | Unauthorized | No/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 500 | Server Error | Unexpected error |

---

## 💡 Tips & Best Practices

### 1. Caching Strategy
```javascript
// Cache dashboard data for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const getCachedData = (key) => {
  const cached = localStorage.getItem(key);
  if (!cached) return null;
  
  const { data, timestamp } = JSON.parse(cached);
  if (Date.now() - timestamp > CACHE_DURATION) {
    localStorage.removeItem(key);
    return null;
  }
  
  return data;
};

const setCachedData = (key, data) => {
  localStorage.setItem(key, JSON.stringify({
    data,
    timestamp: Date.now()
  }));
};
```

### 2. Auto-Refresh
```javascript
// Auto-refresh every 30 seconds
useEffect(() => {
  const interval = setInterval(() => {
    fetchDashboardData();
  }, 30000);
  
  return () => clearInterval(interval);
}, []);
```

### 3. Error Handling
```javascript
const fetchWithRetry = async (url, options, retries = 3) => {
  try {
    return await fetch(url, options);
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
};
```

### 4. Loading States
```javascript
const [loading, setLoading] = useState({
  stats: true,
  pets: true,
  cases: true
});

// Update individual loading states
setLoading(prev => ({ ...prev, stats: false }));
```

---

## 🔗 Related Endpoints

- [Chunk 1: Pet Owner Authentication](./API_QUICK_REFERENCE_CHUNK1.md)
- [Chunk 2: SOAP Reports & Diagnosis](./API_QUICK_REFERENCE_CHUNK2.md)
- [Chunk 3: Admin Authentication](./API_QUICK_REFERENCE_CHUNK3.md)
- [Full Implementation Summary](./CHUNK4_IMPLEMENTATION_SUMMARY.md)

---

**Last Updated**: November 1, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready

