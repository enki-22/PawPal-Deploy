# Chunk 5: Admin Reports - API Quick Reference

## 🚀 Quick Start

**Base URL**: `http://localhost:8000/api/admin`  
**Authentication**: JWT Bearer Token (from Chunk 3)  
**Permissions**: MASTER, VET, DESK (all admin roles)  
**Format**: JSON

---

## 📋 Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reports` | List reports with search, filters, pagination |
| GET | `/reports/:caseId` | Get detailed SOAP report by case ID |
| GET | `/reports/flagged` | Get flagged reports by severity |

---

## 📊 1. List Reports with Filters

### GET `/reports`

Get paginated list of reports with advanced search and filtering.

**Query Parameters:**
| Parameter | Type | Options | Default | Description |
|-----------|------|---------|---------|-------------|
| `search` | string | Any text | - | Search pet name, owner name, or case ID |
| `dateRange` | string | today, last_7_days, last_30_days, custom, all_time | all_time | Filter by date |
| `custom_start` | string | YYYY-MM-DD | - | Custom range start (requires dateRange=custom) |
| `custom_end` | string | YYYY-MM-DD | - | Custom range end (requires dateRange=custom) |
| `species` | string | all, dogs, cats, birds, rabbits, others | all | Filter by species |
| `flagLevel` | string | all, emergency, urgent, moderate | all | Filter by flag level |
| `page` | integer | >= 1 | 1 | Page number |
| `limit` | integer | 1-100 | 10 | Items per page |

**Basic Request:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**With Search:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?search=Max" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**With Filters:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?dateRange=last_7_days&species=dogs&flagLevel=urgent&page=1&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Custom Date Range:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?dateRange=custom&custom_start=2025-10-01&custom_end=2025-10-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "results": [
    {
      "case_id": "#PDX-2025-1101-001",
      "pet_name": "Max",
      "species": "Dog",
      "breed": "Golden Retriever",
      "owner_name": "John Doe",
      "date_generated": "2025-11-01T14:30:00Z",
      "flag_level": "Urgent"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "filters": {
    "search": "Max",
    "dateRange": "last_7_days",
    "species": "dogs",
    "flagLevel": "urgent"
  }
}
```

**Error Response - Invalid Parameters (400):**
```json
{
  "success": false,
  "error": "Invalid filter parameters",
  "details": "Invalid species. Must be one of: all, dogs, cats, birds, rabbits, others"
}
```

---

## 📄 2. Get Detailed Report

### GET `/reports/:caseId`

Get complete SOAP report with all details.

**URL Parameters:**
- `caseId`: Case ID (e.g., `%23PDX-2025-1101-001`)

**Note**: URL encode `#` as `%23` or omit it

**Request:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports/%23PDX-2025-1101-001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Or without # prefix:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports/PDX-2025-1101-001" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "report": {
    "case_id": "#PDX-2025-1101-001",
    "pet_info": {
      "id": 15,
      "name": "Max",
      "species": "Dog",
      "breed": "Golden Retriever",
      "age": 5,
      "sex": "Male",
      "weight": 32.5,
      "image": "http://localhost:8000/media/pets/max.jpg",
      "medical_notes": "No known allergies"
    },
    "owner_info": {
      "id": 10,
      "name": "John Doe",
      "email": "john.doe@example.com",
      "username": "johndoe"
    },
    "subjective": "Owner reports that Max has been vomiting for 2 days and has lost appetite...",
    "objective": {
      "symptoms": ["vomiting", "lethargy", "loss of appetite"],
      "duration": "2 days",
      "image_analysis": null
    },
    "assessment": [
      {
        "condition": "Gastroenteritis",
        "likelihood": 0.85,
        "urgency": "Moderate",
        "description": "Inflammation of the stomach and intestines caused by infection or dietary indiscretion...",
        "matched_symptoms": ["vomiting", "lethargy", "loss of appetite"],
        "contagious": false
      },
      {
        "condition": "Pancreatitis",
        "likelihood": 0.62,
        "urgency": "Moderate",
        "description": "Inflammation of the pancreas...",
        "matched_symptoms": ["vomiting", "loss of appetite"],
        "contagious": false
      }
    ],
    "plan": {
      "severityLevel": "Moderate",
      "careAdvice": [
        "Monitor pet's condition closely for next 24 hours",
        "Withhold food for 12-24 hours, allow small sips of water",
        "Gradually reintroduce bland diet (boiled chicken and rice)",
        "Schedule veterinary appointment within 24-48 hours if symptoms persist",
        "Seek immediate care if symptoms worsen or blood appears in vomit"
      ]
    },
    "flag_level": "Moderate",
    "date_generated": "2025-11-01T14:30:00Z",
    "date_flagged": "2025-11-01T14:30:00Z"
  }
}
```

**Error Response - Not Found (404):**
```json
{
  "success": false,
  "error": "Report not found",
  "case_id": "#PDX-9999-9999-999"
}
```

---

## 🚨 3. Get Flagged Reports

### GET `/reports/flagged`

Get all flagged cases with optional severity filter.

**Query Parameters:**
- `filter`: all | emergency | urgent | moderate (default: all)

**Request - All Flagged:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports/flagged" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Request - Emergency Only:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports/flagged?filter=emergency" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Success Response (200):**
```json
{
  "success": true,
  "filter": "emergency",
  "count": 2,
  "reports": [
    {
      "case_id": "#PDX-2025-1101-005",
      "pet_info": {
        "name": "Buddy",
        "species": "Dog",
        "breed": "German Shepherd",
        "age": 7
      },
      "owner_info": {
        "name": "Alice Johnson",
        "email": "alice.j@example.com"
      },
      "top_diagnosis": {
        "condition": "Severe Respiratory Distress",
        "likelihood": 0.95,
        "urgency": "Severe",
        "description": "Critical breathing difficulties requiring immediate veterinary attention..."
      },
      "flag_level": "Emergency",
      "date_flagged": "2025-11-01T16:20:00Z",
      "subjective": "Pet is having extreme difficulty breathing, gums are turning blue, tongue appears swollen. Symptoms started 30 minutes ago..."
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

---

## 🔍 Search Examples

### Search by Pet Name
```bash
curl -X GET "http://localhost:8000/api/admin/reports?search=Max" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Search by Owner Name
```bash
curl -X GET "http://localhost:8000/api/admin/reports?search=John" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Search by Case ID
```bash
curl -X GET "http://localhost:8000/api/admin/reports?search=PDX-2025-1101" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🎯 Filter Examples

### Date Range Filters

**Today's Reports:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?dateRange=today" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Last 7 Days:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?dateRange=last_7_days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Last 30 Days:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?dateRange=last_30_days" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Custom Date Range:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?dateRange=custom&custom_start=2025-10-01&custom_end=2025-10-31" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Species Filters

**Dogs Only:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?species=dogs" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Cats Only:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?species=cats" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Other Animals:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?species=others" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Flag Level Filters

**Emergency Cases:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?flagLevel=emergency" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Urgent Cases:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?flagLevel=urgent" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Moderate Cases:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?flagLevel=moderate" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Combined Filters

**Emergency Dogs from Last 7 Days:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?dateRange=last_7_days&species=dogs&flagLevel=emergency" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Search + Filters:**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?search=Max&species=dogs&flagLevel=urgent" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📄 Pagination Examples

**First Page (10 items):**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?page=1&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Second Page (20 items per page):**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?page=2&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Maximum Items (100):**
```bash
curl -X GET "http://localhost:8000/api/admin/reports?page=1&limit=100" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 💻 Frontend Integration Examples

### React Example
```javascript
import { useState, useEffect } from 'react';
import axios from 'axios';

const ReportsPage = () => {
  const [reports, setReports] = useState([]);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    search: '',
    dateRange: 'all_time',
    species: 'all',
    flagLevel: 'all',
    page: 1,
    limit: 20
  });
  
  const fetchReports = async () => {
    const token = localStorage.getItem('admin_token');
    
    try {
      const response = await axios.get(
        'http://localhost:8000/api/admin/reports',
        {
          params: filters,
          headers: { 'Authorization': `Bearer ${token}` }
        }
      );
      
      setReports(response.data.results);
      setPagination(response.data.pagination);
    } catch (error) {
      console.error('Failed to fetch reports:', error);
    }
  };
  
  useEffect(() => {
    fetchReports();
  }, [filters]);
  
  const handleSearch = (searchTerm) => {
    setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
  };
  
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };
  
  const handlePageChange = (newPage) => {
    setFilters(prev => ({ ...prev, page: newPage }));
  };
  
  return (
    <div>
      <SearchBar onSearch={handleSearch} />
      <FilterControls filters={filters} onChange={handleFilterChange} />
      <ReportsList reports={reports} />
      <Pagination pagination={pagination} onPageChange={handlePageChange} />
    </div>
  );
};
```

### Vue.js Example
```javascript
export default {
  data() {
    return {
      reports: [],
      pagination: {},
      filters: {
        search: '',
        dateRange: 'all_time',
        species: 'all',
        flagLevel: 'all',
        page: 1,
        limit: 20
      }
    }
  },
  
  watch: {
    filters: {
      handler() {
        this.fetchReports();
      },
      deep: true
    }
  },
  
  methods: {
    async fetchReports() {
      const token = localStorage.getItem('admin_token');
      
      try {
        const response = await this.$http.get('/api/admin/reports', {
          params: this.filters,
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        this.reports = response.data.results;
        this.pagination = response.data.pagination;
      } catch (error) {
        this.$toast.error('Failed to load reports');
      }
    },
    
    async viewReport(caseId) {
      const token = localStorage.getItem('admin_token');
      
      try {
        const response = await this.$http.get(
          `/api/admin/reports/${encodeURIComponent(caseId)}`,
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        this.$router.push({
          name: 'ReportDetail',
          params: { report: response.data.report }
        });
      } catch (error) {
        this.$toast.error('Report not found');
      }
    }
  },
  
  mounted() {
    this.fetchReports();
  }
}
```

---

## 🔒 Authentication & Errors

### Required Headers
```bash
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json
```

### Error Responses

**401 Unauthorized** (No/Invalid Token):
```json
{
  "success": false,
  "error": "Authentication required",
  "code": "AUTH_REQUIRED"
}
```

**400 Bad Request** (Invalid Parameters):
```json
{
  "success": false,
  "error": "Invalid filter parameters",
  "details": "Limit must be between 1 and 100"
}
```

**404 Not Found** (Report Not Found):
```json
{
  "success": false,
  "error": "Report not found",
  "case_id": "#PDX-9999-9999-999"
}
```

**500 Internal Server Error**:
```json
{
  "success": false,
  "error": "Failed to fetch reports",
  "details": "Internal server error"
}
```

---

## 💡 Best Practices

### 1. Search with Debouncing
```javascript
// Debounce search input to avoid excessive API calls
const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
};

const debouncedSearch = debounce((searchTerm) => {
  setFilters(prev => ({ ...prev, search: searchTerm, page: 1 }));
}, 300); // 300ms delay
```

### 2. URL State Management
```javascript
// Store filters in URL for shareable links
const updateURL = (filters) => {
  const params = new URLSearchParams(filters);
  window.history.pushState({}, '', `?${params.toString()}`);
};

// Read filters from URL on load
const getFiltersFromURL = () => {
  const params = new URLSearchParams(window.location.search);
  return {
    search: params.get('search') || '',
    dateRange: params.get('dateRange') || 'all_time',
    species: params.get('species') || 'all',
    flagLevel: params.get('flagLevel') || 'all',
    page: parseInt(params.get('page')) || 1,
    limit: parseInt(params.get('limit')) || 20
  };
};
```

### 3. Optimistic UI Updates
```javascript
// Show loading state immediately
setLoading(true);

try {
  const response = await fetchReports(filters);
  setReports(response.data.results);
} catch (error) {
  // Revert to previous state on error
  showError('Failed to load reports');
} finally {
  setLoading(false);
}
```

### 4. Cache Frequently Accessed Reports
```javascript
const reportCache = new Map();

const getReport = async (caseId) => {
  // Check cache first
  if (reportCache.has(caseId)) {
    return reportCache.get(caseId);
  }
  
  // Fetch from API
  const response = await axios.get(`/api/admin/reports/${caseId}`);
  const report = response.data.report;
  
  // Cache for 5 minutes
  reportCache.set(caseId, report);
  setTimeout(() => reportCache.delete(caseId), 5 * 60 * 1000);
  
  return report;
};
```

---

## 📊 Response Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Request successful |
| 400 | Bad Request | Invalid parameters |
| 401 | Unauthorized | No/invalid token |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not Found | Report not found |
| 500 | Server Error | Unexpected error |

---

## 🔗 Related Endpoints

- [Chunk 1: Pet Owner Authentication](./API_QUICK_REFERENCE_CHUNK1.md)
- [Chunk 2: SOAP Reports & Diagnosis](./API_QUICK_REFERENCE_CHUNK2.md)
- [Chunk 3: Admin Authentication](./API_QUICK_REFERENCE_CHUNK3.md)
- [Chunk 4: Admin Dashboard](./API_QUICK_REFERENCE_CHUNK4.md)
- [Full Implementation Summary](./CHUNK5_IMPLEMENTATION_SUMMARY.md)

---

**Last Updated**: November 1, 2025  
**Version**: 1.0  
**Status**: ✅ Production Ready

