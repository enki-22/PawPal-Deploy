PAWPAL WEBAPP - MISSING FEATURES SPECIFICATION
TECH STACK CONTEXT
•	Frontend: React
•	Backend: Python Django
•	Database: PostgreSQL
•	AI/ML: Random Forest (separate implementation), Image Classifier
•	Email Service: TBD (Recommendations: SendGrid, AWS SES, or Django's built-in SMTP with Gmail)
•	File Storage: TBD (Recommendations: AWS S3, Cloudinary, or local storage for development)
________________________________________
PRIORITY OVERVIEW
🔴 HIGH PRIORITY (Core Functionality)
1.	AI Diagnosis Report Generation - Display AI-generated SOAP reports with proper UI/UX
2.	Admin Side Functionalities - Complete admin dashboard, reports, clients, pets, roles, announcements
3.	Flagging Cases System - Automatic severity flagging (Moderate, Urgent, Emergency)
🟡 MEDIUM PRIORITY (Essential Features)
4.	OTP Verification (Account Creation) - Email-based account verification
5.	OTP Verification (Password Reset) - Secure password recovery flow
🟢 LOW PRIORITY (Enhancements)
6.	Admin Profile Settings - Profile management and security options
7.	Announcement Management - Create/edit/delete announcements
Note: Random Forest model training and integration is handled in a separate prompt.

SHARED DATA STRUCTURES
SOAP Report Object
json
{
  "caseId": "string (format: #PDX-YYYY-MMDD-XXX)",
  "petId": "string",
  "ownerId": "string",
  "petName": "string",
  "ownerName": "string",
  "dateGenerated": "ISO 8601 datetime",
  "petInfo": {
    "species": "string",
    "breed": "string",
    "age": "string",
    "sex": "string",
    "bloodType": "string",
    "spayedNeutered": "boolean",
    "allergies": "string or null",
    "chronicDisease": "string or null"
  },
  "ownerInfo": {
    "cityProvince": "string",
    "contactNumber": "string"
  },
  "subjective": "string (owner's observations)",
  "objective": {
    "symptoms": ["array of symptom strings"],
    "duration": "string (e.g., '2 days')"
  },
  "assessment": [
    {
      "condition": "string",
      "likelihood": "number (0-1, display as percentage)",
      "description": "string",
      "matchedSymptoms": ["array of strings"],
      "urgency": "string (Mild|Moderate|Severe)",
      "contagious": "boolean"
    }
  ],
  "plan": {
    "severityLevel": "string (Moderate|Urgent|Emergency)",
    "careAdvice": ["array of care instruction strings"]
  },
  "flagLevel": "string (Moderate|Urgent|Emergency)"
}
OTP Object
json
{
  "userId": "string",
  "email": "string",
  "otpCode": "string (6-digit numeric)",
  "purpose": "string (account_creation|password_reset)",
  "expiresAt": "ISO 8601 datetime",
  "attempts": "number",
  "isVerified": "boolean"
}
Admin Account Object
json
{
  "adminId": "string",
  "name": "string",
  "email": "string",
  "role": "string (Master Admin|Veterinarian|Front Desk)",
  "accountStatus": "string (Active|Inactive)",
  "profileImage": "string (URL or null)",
  "clinicInfo": "string or null",
  "contactNumber": "string (masked)",
  "recoveryEmail": "string or null",
  "passwordLastUpdated": "ISO 8601 datetime",
  "dateCreated": "ISO 8601 datetime"
}
Announcement Object
json
{
  "announcementId": "string",
  "title": "string",
  "description": "string",
  "validUntil": "ISO 8601 date or 'Ongoing'",
  "iconType": "string (vaccination|wellness|welcome|general)",
  "isActive": "boolean",
  "dateCreated": "ISO 8601 datetime"
}
```

---

## REQUIRED API ENDPOINTS

### Pet Owner Side - Authentication
```
POST   /api/auth/register              - Create new user account
POST   /api/auth/send-otp               - Send OTP to email
POST   /api/auth/verify-otp             - Verify OTP code
POST   /api/auth/request-password-reset - Initiate password reset
POST   /api/auth/reset-password         - Complete password reset
POST   /api/auth/login                  - User login
```

### Pet Owner Side - Diagnosis
```
GET    /api/diagnosis/:petId            - Get all diagnoses for a pet
POST   /api/diagnosis/generate          - Create AI diagnosis (assumes ML model exists)
GET    /api/diagnosis/soap/:caseId      - Get specific SOAP report
GET    /api/diagnosis/flagged/:petId    - Get flagged cases for a pet
```

### Admin Side - Authentication
```
POST   /api/admin/login                 - Admin login
POST   /api/admin/logout                - Admin logout
POST   /api/admin/change-password       - Update admin password
PUT    /api/admin/profile               - Update admin profile
POST   /api/admin/recovery-email        - Set recovery email
```

### Admin Side - Dashboard
```
GET    /api/admin/dashboard/stats       - Get dashboard metrics (users, pets, reports, conversations)
GET    /api/admin/dashboard/recent-pets - Get recently added pets
GET    /api/admin/dashboard/flagged-cases - Get flagged SOAP reports
GET    /api/admin/dashboard/charts      - Get chart data (species, symptoms)
GET    /api/admin/dashboard/faqs        - Get FAQ list
```

### Admin Side - Reports
```
GET    /api/admin/reports               - Get all SOAP reports (with filters)
GET    /api/admin/reports/:caseId       - Get specific SOAP report
GET    /api/admin/reports/flagged       - Get all flagged cases
```

### Admin Side - Clients
```
GET    /api/admin/clients               - Get all registered pet owners (with filters)
GET    /api/admin/clients/:userId       - Get specific client details
PUT    /api/admin/clients/:userId       - Update client information
POST   /api/admin/clients/:userId/verify - Verify client account
POST   /api/admin/clients/:userId/deactivate - Deactivate client account
POST   /api/admin/clients/:userId/email - Send email to client
```

### Admin Side - Pets
```
GET    /api/admin/pets                  - Get all registered pets (with filters)
GET    /api/admin/pets/:petId           - Get pet medical record page
GET    /api/admin/pets/:petId/medical-records - Get medical records
GET    /api/admin/pets/:petId/vaccinations - Get vaccination records
GET    /api/admin/pets/:petId/chat-history - Get chat history list
GET    /api/admin/pets/:petId/chat/:chatId - Get specific chat conversation
GET    /api/admin/pets/:petId/files     - Get downloadable medical files
```

### Admin Side - Admin Roles (Master Admin Only)
```
GET    /api/admin/roles                 - Get all admin accounts (with filters)
POST   /api/admin/roles                 - Create new admin account
GET    /api/admin/roles/:adminId        - Get specific admin details
PUT    /api/admin/roles/:adminId        - Update admin account
DELETE /api/admin/roles/:adminId        - Delete admin account
PUT    /api/admin/roles/:adminId/status - Toggle admin active/inactive status
```

### Admin Side - Announcements
```
GET    /api/admin/announcements         - Get all announcements
POST   /api/admin/announcements         - Create new announcement
PUT    /api/admin/announcements/:id     - Update announcement
DELETE /api/admin/announcements/:id     - Delete announcement
GET    /api/admin/announcements/active  - Get active announcements only
```

---

## BUSINESS RULES & LOGIC

### Flagging Logic
Diagnoses are automatically flagged based on the highest likelihood condition:

- **Emergency**: 
  - Likelihood ≥ 90% AND urgency = "Severe"
  - OR specific critical symptoms detected (seizures, difficulty breathing, severe bleeding)
  
- **Urgent**: 
  - Likelihood ≥ 75% AND urgency = "Moderate" or "Severe"
  - OR symptoms persisting > 3 days with declining condition
  
- **Moderate**: 
  - Likelihood ≥ 60% OR urgency = "Mild" to "Moderate"
  - OR general health concerns requiring veterinary attention

**Implementation Note**: Apply flagging immediately after SOAP report generation and store in database.

### OTP Rules
- **Code Generation**: 6-digit numeric, cryptographically random
- **Expiration**: 10 minutes from generation
- **Attempt Limit**: Maximum 3 verification attempts
- **Cooldown**: 5-minute cooldown after 3 failed attempts
- **Rate Limiting**: Max 3 OTP requests per email per hour
- **Single Use**: OTP invalidated after successful verification

### Admin Permission Matrix

| Feature | Master Admin | Veterinarian | Front Desk | Pet Owner |
|---------|-------------|--------------|------------|-----------|
| **Dashboard Access** | ✓ | ✓ | ✓ | ✗ |
| **View SOAP Reports** | ✓ | ✓ | ✓ | Own pets only |
| **Generate AI Diagnosis** | ✗ | ✗ | ✗ | ✓ |
| **View Client List** | ✓ | ✓ | ✓ | ✗ |
| **Edit Client Info** | ✓ | ✓ | ✗ | ✗ |
| **Verify/Deactivate Clients** | ✓ | ✓ | ✗ | ✗ |
| **View Pet Records** | ✓ | ✓ | ✓ | Own pets only |
| **Edit Pet Medical Records** | ✓ | ✓ | ✗ | ✗ |
| **Create/Edit/Delete Admins** | ✓ (Admin Roles page) | ✗ | ✗ | ✗ |
| **Create/Edit Announcements** | ✓ | ✓ | ✓ | ✗ |
| **View Flagged Cases** | ✓ | ✓ | ✓ | ✗ |

### Password Requirements
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character
- Cannot be same as previous 3 passwords

---

## SECTION 1: PET OWNER FEATURES

### 1.1 OTP Verification (Account Creation)

**Priority**: 🟡 MEDIUM

**User Flow**:
1. User fills registration form (name, email, password, contact info)
2. Upon submission, system generates 6-digit OTP
3. Email sent to user with OTP code and expiry time (10 minutes)
4. User redirected to "Verify Email" page
5. User enters OTP code
6. If valid: Account activated → Redirect to login page with success message
7. If invalid/expired: Show error → Allow resend OTP option

**Technical Requirements**:
- Generate cryptographically secure 6-digit numeric code
- Store OTP in database with expiration timestamp
- Email template should include: OTP code, expiry time, PawPal branding
- Implement rate limiting (max 3 OTP requests per hour per email)
- Log all OTP generation and verification attempts

**API Endpoints**:
- `POST /api/auth/register` - Creates user, generates OTP, sends email
- `POST /api/auth/send-otp` - Resends OTP if expired
- `POST /api/auth/verify-otp` - Verifies code and activates account

**Acceptance Criteria**:
- [ ] 6-digit numeric OTP generated
- [ ] Email delivered within 5 seconds
- [ ] OTP expires after exactly 10 minutes
- [ ] User redirected to login after successful verification
- [ ] Clear error messages for invalid/expired codes
- [ ] "Resend OTP" button available after 60 seconds
- [ ] Maximum 3 verification attempts before requiring new OTP
- [ ] Email template matches PawPal branding (purple theme)

**Email Template Structure**:
```
Subject: Verify Your PawPal Account

Hi [Name],

Welcome to PawPal! Please verify your email address using the code below:

[OTP CODE: 123456]

This code will expire in 10 minutes.

If you didn't create a PawPal account, please ignore this email.

Best regards,
The PawPal Team
```

**UI Components Needed**:
- Registration form page (if not exists)
- "Verify Email" page with OTP input (6 individual digit boxes)
- Loading state during verification
- Success toast/modal on completion
- Resend OTP button with countdown timer

---

### 1.2 OTP Verification (Password Reset)

**Priority**: 🟡 MEDIUM

**User Flow**:
1. User clicks "Forgot Password" on login page
2. User enters email address
3. System generates 6-digit OTP and sends to email
4. User redirected to "Verify OTP" page
5. User enters OTP code
6. If valid: Redirect to "Create New Password" page
7. User enters new password (with confirmation field)
8. Password updated → Redirect to login page with success message

**Technical Requirements**:
- Same OTP generation logic as account creation
- OTP purpose field: "password_reset"
- Invalidate all existing sessions for that user after password change
- New password cannot match last 3 passwords (store hashed history)

**API Endpoints**:
- `POST /api/auth/request-password-reset` - Sends OTP
- `POST /api/auth/verify-otp` - Verifies OTP (same as account creation)
- `POST /api/auth/reset-password` - Updates password with OTP validation

**Acceptance Criteria**:
- [ ] OTP sent to registered email only
- [ ] Generic message shown whether email exists or not (security)
- [ ] OTP expires after 10 minutes
- [ ] User redirected to "Create New Password" page after verification
- [ ] Password strength indicator shown during creation
- [ ] Confirmation password must match
- [ ] User redirected to login after successful password reset
- [ ] All existing sessions invalidated after password change
- [ ] Success message shown: "Password successfully updated. Please login."

**Email Template Structure**:
```
Subject: Reset Your PawPal Password

Hi [Name],

We received a request to reset your password. Use the code below to continue:

[OTP CODE: 123456]

This code will expire in 10 minutes.

If you didn't request a password reset, please secure your account immediately.

Best regards,
The PawPal Team
UI Components Needed:
•	"Forgot Password" page with email input
•	"Verify OTP" page (same as account creation)
•	"Create New Password" page with password strength indicator
•	Success modal/toast after password reset
________________________________________
1.3 AI Diagnosis Report Generation & Display
Priority: 🔴 HIGH
Context: This feature displays AI-generated SOAP reports. The actual diagnosis logic (Random Forest + Image Classifier) is implemented separately. This section focuses only on the UI/UX after the AI model returns predictions.
User Flow:
1.	User completes symptom checker conversation with chatbot
2.	Chatbot collects: symptoms, duration, pet info, optional images
3.	System sends data to AI model endpoint (implemented separately)
4.	Loading modal appears: "Analyzing [Pet Name]'s symptoms..."
5.	After AI response received (2-5 seconds typical): 
o	Modal updates: "[Pet Name]'s Pet health summary has been generated. Here's the report:"
o	Button appears: "View AI Diagnosis Report"
6.	User clicks button → Redirect to SOAP Report page
7.	SOAP report displayed with full formatting
8.	Report automatically saved to pet's medical history
Technical Requirements:
•	AI Model Integration Point: 
o	Endpoint: POST /api/ml/predict (implemented in separate ML prompt)
o	Request payload: symptoms, duration, pet metadata, optional image
o	Response: JSON with predictions array (condition, likelihood, urgency, matched symptoms)
•	SOAP Generation: Backend formats AI predictions into structured SOAP report
•	Case ID Generation: Format #PDX-YYYY-MMDD-XXX (XXX = sequential number for that day)
•	Flagging: Automatically apply flagging logic after report generation
•	Storage: Save complete SOAP report to database
•	Associate: Link SOAP report to pet ID and chat conversation ID
API Endpoints:
•	POST /api/diagnosis/generate - Receives symptoms → calls ML model → formats SOAP → returns case ID
•	GET /api/diagnosis/soap/:caseId - Retrieves formatted SOAP report for display
SOAP Report Display Structure:
Header Section:
•	PawPal logo (top left)
•	Date Generated (top right)
•	Case ID (top right, below date)
Pet & Owner Information (Two Columns):
Left Column - Owner Info:
•	Pet Owner Name
•	Sex
•	City/Province
•	Blood Type
•	Contact Number
•	Spayed/Neutered status
Right Column - Pet Info:
•	Pet Name
•	Age
•	Animal Type
•	Allergies
•	Breed
•	Chronic Disease
SOAP Sections (with purple headers):
S - Subjective:
•	Narrative paragraph summarizing owner's observations
•	Include: symptoms reported, behavioral changes, timeline
O - Objective:
•	Bullet list of symptoms entered
•	Symptom duration noted
•	Reference to pet's existing medical information
A - Assessment: For each diagnosis (top 3), display card with:
•	Condition name (heading)
•	Likelihood percentage (large, prominent)
•	Description paragraph
•	Matched Symptoms: bullet list
•	Urgency level (color-coded badge)
•	Contagious status (Yes/No with icon)
P - Plan:
•	Severity Level: Display in colored badge (Moderate=yellow, Urgent=orange, Emergency=red)
•	Recommendation paragraph: Advise veterinary consultation
•	Care Advice: Bullet list of home care instructions
Design Specifications:
•	Background: Clean white with subtle gray borders
•	Accent color: Purple (#6B46C1 or similar)
•	Section headers: Purple background with white text
•	Typography: Professional, clinical font (e.g., Inter, Open Sans)
•	Cards: Rounded corners (8px), subtle shadows
•	Badges: Rounded, color-coded by severity
•	Spacing: Generous whitespace for readability
•	Print-friendly: CSS optimized for printing/PDF export
Acceptance Criteria:
•	Loading modal shows during AI processing
•	Loading state has spinner/animation
•	Loading timeout after 30 seconds (show error message)
•	Success modal displays pet name dynamically
•	"View AI Diagnosis Report" button redirects correctly
•	SOAP report renders all sections accurately
•	Case ID format is correct and unique
•	Likelihood percentages displayed correctly (89%, not 0.89)
•	Urgency badges color-coded properly
•	Report is responsive (desktop and tablet)
•	Report can be printed cleanly
•	Report saved to database immediately after generation
•	Pet owner can access report from "My Pets" section later
Error Handling:
•	AI model timeout (>30s): "We're experiencing high demand. Please try again in a few minutes."
•	AI model error: "Unable to generate diagnosis. Please check your symptoms and try again."
•	No symptoms provided: "Please provide at least 2 symptoms for accurate analysis."
•	Network error: "Connection lost. Your data is saved. Please refresh and try again."
UI Components Needed:
•	Loading modal component (with animation)
•	Success modal component
•	SOAP report page (full layout)
•	Diagnosis assessment cards (reusable component)
•	Severity badge component
•	Printable stylesheet
________________________________________
1.4 Flagging Cases System
Priority: 🔴 HIGH
Description: After AI diagnosis is generated, the system automatically flags the case based on severity. This flag is stored with the diagnosis and visible to admins on the admin dashboard.
Flagging Logic (Applied automatically):
python
def calculate_flag_level(assessment):
    # Get highest likelihood diagnosis
    top_diagnosis = max(assessment, key=lambda x: x['likelihood'])
    
    likelihood = top_diagnosis['likelihood']
    urgency = top_diagnosis['urgency'].lower()
    
    # Emergency conditions
    if likelihood >= 0.90 and urgency == 'severe':
        return 'Emergency'
    if 'seizure' in matched_symptoms or 'difficulty breathing' in matched_symptoms:
        return 'Emergency'
    
    # Urgent conditions
    if likelihood >= 0.75 and urgency in ['moderate', 'severe']:
        return 'Urgent'
    if symptom_duration_days > 3 and likelihood >= 0.60:
        return 'Urgent'
    
    # Moderate conditions
    if likelihood >= 0.60:
        return 'Moderate'
    
    # Default
    return 'Moderate'
Database Schema Addition:
sql
ALTER TABLE soap_reports ADD COLUMN flag_level VARCHAR(20);
ALTER TABLE soap_reports ADD COLUMN date_flagged TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX idx_flag_level ON soap_reports(flag_level);
Admin Dashboard Display:
•	Flagged cases appear in "Flagged Cases" widget on admin dashboard
•	Color coding: 
o	Emergency: Red background, white text
o	Urgent: Orange background, white text
o	Moderate: Yellow background, dark text
•	Each flagged case card shows: 
o	Pet name and species icon
o	Condition name
o	Likelihood percentage
o	Urgency level badge
o	Pet owner name
o	Date flagged
o	"View Report" button
API Endpoint:
•	GET /api/admin/dashboard/flagged-cases?filter=all|emergency|urgent|moderate
Acceptance Criteria:
•	Flag level calculated immediately after SOAP generation
•	Flag level stored in database
•	Flagged cases visible on admin dashboard
•	Cases sorted by severity (Emergency → Urgent → Moderate)
•	Color coding consistent across all admin views
•	Admin can click flagged case to view full SOAP report
•	Pet owner does NOT see their own flag level (shown only to admins)
•	"View All Flagged SOAP Reports" button redirects to Reports page with filter applied
UI Components Needed:
•	Flagged case card component (for dashboard widget)
•	Severity badge component (reusable)
•	Filter dropdown for flagged cases page
________________________________________
SECTION 2: ADMIN SIDE FEATURES
2.1 Admin Authentication & Login
Priority: 🔴 HIGH
Description: Separate login system for admin accounts (Master Admin, Veterinarian, Front Desk). Admins cannot use the pet owner login page.
User Flow:
1.	Admin navigates to /admin/login
2.	Enters email and password
3.	System validates credentials and role
4.	If valid: Redirect to admin dashboard
5.	Dashboard renders based on admin role permissions
Technical Requirements:
•	Separate authentication table for admins
•	Role-based access control (RBAC)
•	JWT token with role embedded
•	Password reset for Veterinarian and Front Desk only (NOT Master Admin)
•	Session timeout: 8 hours of inactivity
API Endpoints:
•	POST /api/admin/login - Returns JWT with role
•	POST /api/admin/logout - Invalidates token
•	POST /api/admin/request-password-reset - For non-Master admins only
•	GET /api/admin/verify-token - Validates JWT and returns user info
Login Page Elements:
•	PawPal logo
•	"Admin Portal" heading
•	Email input
•	Password input (with show/hide toggle)
•	"Remember Me" checkbox
•	"Login" button (purple)
•	"Forgot Password?" link (disabled if user is Master Admin after login attempt)
Password Reset Flow (Veterinarian & Front Desk Only):
•	Similar OTP flow as pet owner side
•	OTP sent to admin's registered email
•	Cannot reset Master Admin password via OTP
Acceptance Criteria:
•	Admin login page separate from pet owner login (/admin/login vs /login)
•	Credentials validated against admin table
•	JWT token includes admin role
•	Redirect to dashboard after successful login
•	Error message for invalid credentials
•	"Forgot Password" only available for non-Master admins
•	Session expires after 8 hours inactivity
•	Logout button available on all admin pages
________________________________________
2.2 Admin Dashboard
Priority: 🔴 HIGH
Access: Master Admin, Veterinarian, Front Desk
Layout Structure:
Navigation Bar (Fixed at top, deep purple):
•	PawPal logo (left)
•	Navigation links (center): 
o	Dashboard
o	Reports
o	Clients
o	Pets
o	Admin Roles (Master Admin only)
o	Announcements
•	Admin avatar + profile menu (right)
Dashboard Content:
Top Summary Cards (4 cards in a row):
1.	Users: Total count
2.	Pets: Total count
3.	SOAP Reports: Count with filter dropdown ("Last 7 Days", "Last 30 Days", "All Time")
4.	Conversations: Count with filter dropdown ("This Week", "This Month", "All Time")
Main Content Grid:
Left Column (60% width):
1.	Frequently Asked Questions (FAQ) 
o	Collapsible accordion list
o	Sample FAQs: 
	"What services do you offer?"
	"How often should I bring my pet for check-ups?"
	"What should I bring for my pet's first visit?"
o	Each FAQ can be expanded/collapsed
o	Fetched from database (admin can edit via CMS - future feature)
2.	Recently Added Pets 
o	Table with columns: Pet Name, Species, Breed, Pet Owner, Registration Date
o	Shows last 5 pets
o	"Show All Pets" button at bottom → redirects to Pets page
3.	Flagged Cases 
o	Card list showing urgent/flagged SOAP reports
o	Each card displays: 
	Pet name and species icon
	Condition
	Likelihood + Urgency badge
	Pet owner
	Date flagged
o	Color-coded by severity (Emergency=red, Urgent=orange, Moderate=yellow)
o	"View All Flagged SOAP Reports" button → redirects to Reports page with filter
Right Sidebar (40% width):
4.	Charts and Statistics 
o	Checks by Species: Bar chart (Dogs, Cats, Birds, Rabbits)
o	Most Common Symptoms: Ranked list with counts 
	Example: Sneezing (45), Vomiting (32), Eye Discharge (28), Appetite Loss (25)
o	Common Symptoms by Species: Grouped list 
	Dogs: [symptoms]
	Cats: [symptoms]
	Rabbits: [symptoms]
	Birds: [symptoms]
o	Latest SOAP Report Generated: Card showing most recent case with quick link
5.	Announcement Management (Sidebar preview) 
o	Shows 2-3 active announcements
o	Each displays: Title, Validity date, Brief description
o	"View All Announcements" button → redirects to Announcements page
Technical Requirements:
•	API Endpoints: 
o	GET /api/admin/dashboard/stats - Returns counts for summary cards
o	GET /api/admin/dashboard/recent-pets - Returns last 5 pets
o	GET /api/admin/dashboard/flagged-cases - Returns flagged SOAP reports
o	GET /api/admin/dashboard/charts - Returns chart data (species breakdown, symptoms)
o	GET /api/admin/dashboard/faqs - Returns FAQ list
o	GET /api/admin/dashboard/announcements - Returns active announcements
•	Filters: Date range filters update via API calls without page reload
•	Real-time updates: Dashboard refreshes every 5 minutes automatically
•	Responsive: Layout adjusts for tablet (stacks sidebar below main content)
Design Specifications:
•	Primary color: Deep purple (#6B46C1)
•	Background: Soft neutral gray (#F5F5F5)
•	Cards: White background, rounded corners (12px), subtle shadow
•	Typography: Clean sans-serif (Inter or similar)
•	Icons: Lucide React or similar icon set
•	Spacing: Consistent 16px padding, 24px gaps between sections
Acceptance Criteria:
•	Navigation bar fixed and consistent across all pages
•	Summary cards display correct counts
•	Date filters work correctly
•	Recent pets table shows last 5 entries
•	Flagged cases color-coded properly
•	Charts render correctly with accurate data
•	FAQ accordion expands/collapses smoothly
•	All "View All" / "Show All" buttons redirect correctly
•	Admin Roles link only visible to Master Admin
•	Dashboard responsive on desktop and tablet
•	Loading states shown during data fetch
UI Components Needed:
•	Dashboard layout component
•	Summary card component
•	FAQ accordion component
•	Data table component (for recent pets)
•	Flagged case card component
•	Bar chart component (use Recharts)
•	Announcement preview card
________________________________________
2.3 Reports Page
Priority: 🔴 HIGH
Access: Master Admin, Veterinarian, Front Desk
Description: Centralized view of all AI-generated SOAP reports with search and filtering capabilities.
Page Layout:
Header:
•	Title: "AI Diagnosis Reports"
•	Search bar (searches by: pet name, owner name, case ID)
•	Filters (dropdowns): 
o	Date Range: Today, Last 7 Days, Last 30 Days, Custom Range, All Time
o	Species: All, Dogs, Cats, Birds, Rabbits, Others
o	Flag Level: All, Emergency, Urgent, Moderate
Reports Table:
Columns:
•	Pet Name (with species icon)
•	Species
•	Breed
•	Pet Owner
•	Case ID
•	Date Generated
•	Flag Level (color-coded badge)
•	Actions (eye icon to view)
Features:
•	Sortable columns (click header to sort)
•	Pagination (10, 25, 50, 100 per page)
•	Row click opens SOAP report in full view
SOAP Report View (opened from table):
•	Full-page modal or new page with SOAP report display
•	Same structure as pet owner SOAP report (see Section 1.3)
•	Additional admin actions: 
o	Print report button
o	Download as PDF button
o	Email to owner button
o	Add to medical records button (if not auto-added)
•	Back button returns to Reports table
Technical Requirements:
•	API Endpoints: 
o	GET /api/admin/reports?search=&dateRange=&species=&flagLevel=&page=&limit= - Returns filtered reports
o	GET /api/admin/reports/:caseId - Returns specific SOAP report
•	Search: Backend search implementation (not client-side filtering)
•	Pagination: Server-side pagination
•	Export: PDF generation using library (e.g., ReportLab for Django)
Acceptance Criteria:
•	Search works across pet name, owner name, case ID
•	All filters work correctly and can be combined
•	Table sortable by all columns
•	Pagination controls work correctly
•	Flag level badges color-coded
•	Clicking row opens full SOAP report
•	SOAP report displays all sections correctly
•	Print button generates printer-friendly format
•	PDF download works and includes all report data
•	Back button returns to Reports page with filters preserved
•	Loading state shown during data fetch
•	Empty state shown when no reports match filters
UI Components Needed (continued):
•	Reports table component
•	Search bar component
•	Filter dropdown components
•	SOAP report modal/page (reuse from pet owner side)
•	Pagination component
•	PDF export functionality
•	Print stylesheet
________________________________________
2.4 Clients Page
Priority: 🔴 HIGH
Access: Master Admin, Veterinarian, Front Desk
Description: Centralized database of all registered pet owners with management capabilities.
Page Layout:
Header:
•	Title: "Registered Clients"
•	Search bar (searches by: name, email)
•	Filters (dropdowns): 
o	Date Range: Today, Last 7 Days, Last 30 Days, Custom Range, All Time
o	Status: All, Active, Inactive, Pending Verification
Clients Table:
Columns:
•	Registered User (name with profile picture thumbnail)
•	Number of Pets (count badge)
•	Email Address
•	Account Status (badge: Active=green, Inactive=red, Pending=yellow)
•	Date Account Created
•	Actions (eye icon to view details)
Features:
•	Sortable columns
•	Pagination (10, 25, 50, 100 per page)
•	Row click opens client detail modal
Client Detail Modal:
Header:
•	Profile image (circular, large)
•	Name
•	Account status badge
•	Date joined
Profile Information Section:
•	Email address
•	Contact number
•	City/Province
•	Full address
•	Account status
Registered Pets Section:
•	Grid/list of pet cards
•	Each card shows: Pet photo, name, species, breed
•	Click pet card → redirects to Pet Medical Record page
Admin Actions (buttons at bottom):
•	Verify Client (if status is "Pending Verification") 
o	Changes status to "Active"
o	Sends confirmation email to client
•	Edit Account 
o	Opens edit form with: Name, Email, Contact, Address
o	Save button updates database
•	Deactivate Account 
o	Shows confirmation modal: "Are you sure you want to deactivate [Name]'s account?"
o	Changes status to "Inactive"
o	Client cannot login while inactive
•	Send Email 
o	Opens email composer modal
o	Pre-fills recipient email
o	Subject and message fields
o	Uses system email service to send
Permission Differences:
•	Master Admin & Veterinarian: Can verify, edit, deactivate, send email
•	Front Desk: Can only view and send email (no edit/deactivate)
Technical Requirements:
•	API Endpoints: 
o	GET /api/admin/clients?search=&dateRange=&status=&page=&limit= - Returns filtered clients
o	GET /api/admin/clients/:userId - Returns detailed client info with pets
o	PUT /api/admin/clients/:userId - Updates client information
o	POST /api/admin/clients/:userId/verify - Verifies client account
o	POST /api/admin/clients/:userId/deactivate - Deactivates account
o	POST /api/admin/clients/:userId/email - Sends email to client
•	Email Service Integration: Configure Django email backend
•	Validation: Email format, phone number format validation
Acceptance Criteria:
•	Search works across name and email
•	All filters work correctly
•	Table sortable by all columns
•	Pagination works correctly
•	Clicking row opens client detail modal
•	Modal displays all client information accurately
•	Pet cards display correctly and link to pet records
•	Verify button only shows for "Pending Verification" status
•	Edit form validates inputs correctly
•	Deactivate shows confirmation modal
•	Deactivated users cannot login
•	Email composer works and sends emails
•	Front Desk users cannot see Edit/Deactivate buttons
•	Success/error messages displayed for all actions
•	Modal closes properly after actions
Email Template for Verification:
Subject: Your PawPal Account Has Been Verified

Hi [Name],

Great news! Your PawPal account has been verified by our team.

You now have full access to all features, including:
- AI-powered symptom checker
- Pet health tracking
- Medical record storage
- Direct communication with veterinarians

Login now: [Login URL]

Best regards,
The PawPal Team
```

**UI Components Needed**:
- Clients table component
- Client detail modal component
- Edit client form modal
- Confirmation modal component
- Email composer modal
- Pet card component
- Status badge component

---

### 2.5 Pets Page

**Priority**: 🔴 HIGH

**Access**: Master Admin, Veterinarian, Front Desk

**Description**: Complete listing of all registered pets with detailed medical record access.

**Page Layout**:

**Header**:
- Title: "Existing Pets"
- Search bar (searches by: pet name, owner name, pet ID)
- Filters (dropdowns):
  - **Species**: All, Dogs, Cats, Birds, Rabbits, Others
  - **Status**: All, Active, Inactive, Deceased

**Pets Table**:

Columns:
- Pet Name (with photo thumbnail and species icon)
- Species
- Breed
- User (owner name)
- Status (Active=green, Inactive=gray, Deceased=black badge)
- Registered Date
- Actions (eye icon to view)

Features:
- Sortable columns
- Pagination (10, 25, 50, 100 per page)
- Row click opens Pet Medical Record page

---

**Pet Medical Record Page** (Full page view):

**Page Header**:
- Pet Owner: [Owner Name]
- Pet ID: [e.g., RP-06-001]
- Registered Date: [Date]

**Layout: Two-Column Design**

*Left Sidebar (30% width)*:

**Pet Profile Card**:
- Pet photo (large, circular or square)
- Name
- Species icon
- Sex icon
- Age
- Breed
- **Medical Info** (collapsible section):
  - Blood Type
  - Spayed/Neutered status
  - Allergies (list or "None")
  - Chronic Diseases (list or "None")

**Downloadable Files** (list):
- Blood Test Results (PDF icon + download button)
- Surgery Reports (PDF icon + download button)
- X-Ray Images (image icon + download button)
- Lab Results (PDF icon + download button)
- "Download All Medical Information" button (downloads ZIP)

**Chat History** (list):
- Shows all chatbot conversations related to this pet
- Each item displays:
  - Conversation title (e.g., "Symptom Checker - June 4, 2025")
  - Date and time
  - Brief preview (first message)
- Click item → redirects to Chat Conversation View (see below)

*Main Content Area (70% width)*:

**Medical Records** (top section):
- Search bar (searches within this pet's records)
- Filter dropdown: **Service Type** (All, Check-up, Laboratory, Vaccination, Surgery)
- Table with columns:
  - Service Type (icon + label)
  - Attending Veterinarian
  - Date
  - Actions (eye icon to view details)
- Pagination if many records

**Vaccination Records** (middle section):
- Table with columns:
  - Date Administered
  - Vaccine Name (e.g., Rabies, Distemper, Bordetella)
  - Administered By (veterinarian name)
  - Next Due Date (if applicable)
  - Status (Up to Date=green, Overdue=red, Upcoming=yellow)

**AI Diagnosis** (bottom section):
- Card showing latest AI diagnosis summary
- Displays:
  - Case ID
  - Condition (top diagnosis)
  - Likelihood percentage
  - Urgency level badge (color-coded)
  - Date Generated
  - "View Full SOAP Report" button → opens SOAP report modal
- If multiple diagnoses exist: "View All Diagnoses" button → shows history list

**Technical Requirements**:
- **API Endpoints**:
  - `GET /api/admin/pets?search=&species=&status=&page=&limit=` - Returns filtered pets
  - `GET /api/admin/pets/:petId` - Returns complete pet medical record data
  - `GET /api/admin/pets/:petId/medical-records?serviceType=` - Returns filtered medical records
  - `GET /api/admin/pets/:petId/vaccinations` - Returns vaccination records
  - `GET /api/admin/pets/:petId/diagnoses` - Returns AI diagnosis history
  - `GET /api/admin/pets/:petId/chat-history` - Returns chat conversation list
  - `GET /api/admin/pets/:petId/files` - Returns downloadable files list
  - `GET /api/admin/pets/:petId/files/:fileId/download` - Downloads specific file
  - `GET /api/admin/pets/:petId/files/download-all` - Downloads ZIP of all files

- **File Storage**: Integrate with chosen storage solution (AWS S3, Cloudinary, or local)
- **ZIP Generation**: Backend creates temporary ZIP file for "Download All" feature

**Acceptance Criteria**:
- [ ] Pets table displays all pets with correct data
- [ ] Search and filters work correctly
- [ ] Clicking pet opens Medical Record page
- [ ] Pet profile displays all information accurately
- [ ] Medical records table filterable by service type
- [ ] Vaccination records display with status badges
- [ ] AI Diagnosis section shows latest diagnosis
- [ ] "View Full SOAP Report" opens correct report
- [ ] Chat history lists all conversations
- [ ] Downloadable files list displays correctly
- [ ] Individual file download works
- [ ] "Download All" creates and downloads ZIP file
- [ ] All sections load smoothly without errors
- [ ] Page is responsive (adapts to tablet view)

---

**Chat Conversation View** (Accessed from Chat History list):

**Page Header**:
- Pet Owner: [Owner Name]
- Case ID: [Case ID if diagnosis generated]
- Registered Date: [Conversation date]

**Main Content**:
- **Chat Interface** (read-only):
  - Shows complete conversation between chatbot and client
  - Messages styled as chat bubbles:
    - Client messages: Right-aligned, light purple background
    - Chatbot messages: Left-aligned, white background with PawPal icon
  - Timestamps for each message
  - Scrollable if long conversation

**Bottom Action**:
- **"View SOAP Report" button** (if diagnosis was generated)
  - Opens SOAP report modal/page
  - Same SOAP report structure as described in Section 1.3

**Technical Requirements**:
- **API Endpoint**:
  - `GET /api/admin/pets/:petId/chat/:chatId` - Returns complete chat conversation

**Acceptance Criteria**:
- [ ] Chat displays all messages in correct order
- [ ] Messages styled correctly (client vs chatbot)
- [ ] Timestamps display correctly
- [ ] Long conversations scrollable
- [ ] "View SOAP Report" button only shows if diagnosis generated
- [ ] SOAP report opens correctly from button
- [ ] Back button returns to Pet Medical Record page

**UI Components Needed**:
- Chat message bubble component
- Chat conversation container
- SOAP report modal (reusable)

---

### 2.6 Admin Roles Page

**Priority**: 🔴 HIGH

**Access**: Master Admin ONLY

**Description**: Master Admin can create, view, edit, and delete other admin accounts. Veterinarian and Front Desk admins do NOT have access to this page.

**Page Layout**:

**Header**:
- Title: "Admin Role Management"
- **"+ Add Admin" button** (purple, right-aligned)
- Search bar (searches by: name, email)
- Filters (dropdowns):
  - **Role**: All, Master Admin, Veterinarian, Front Desk
  - **Status**: All, Active, Inactive

**Admin Table**:

Columns:
- Registered User (name with profile picture thumbnail)
- Email
- Role (badge: Master Admin=purple, Veterinarian=blue, Front Desk=green)
- Account Status (Active=green, Inactive=red badge)
- Date Account Created
- Actions (edit icon, delete icon)

Features:
- Sortable columns
- Pagination (10, 25, 50 per page)
- Row displays action buttons on hover

**"Add Admin" Modal**:

Triggered by "+ Add Admin" button.

**Modal Content**:
- Title: "Create New Admin"
- Form fields:
  - **Name** (text input, required)
  - **Email** (email input, required, must be unique)
  - **Role** (dropdown, required):
    - Veterinarian
    - Front Desk
    - (Master Admin NOT selectable - can only be created via database/script)
  - **Initial Password** (auto-generated, displayed to admin to share with new user)
    - Show "Copy" button next to password
- Buttons:
  - **Cancel** - Closes modal without saving
  - **Save Changes** - Creates admin account

**Behavior**:
- Password auto-generated (strong: 12 chars, mixed case, numbers, symbols)
- New admin receives email with login instructions and temporary password
- New admin required to change password on first login
- Modal closes after successful creation
- Success toast: "Admin account created successfully"

**"Edit Admin" Modal**:

Triggered by clicking edit icon on table row.

**Modal Content**:
- Title: "Edit Admin Account"
- Form fields:
  - **Name** (text input, pre-filled)
  - **Email** (email input, pre-filled, must remain unique)
  - **Role** (dropdown, pre-selected):
    - Veterinarian
    - Front Desk
    - (Cannot change Master Admin role)
  - **Account Status** (toggle switch):
    - Active / Inactive
- Buttons:
  - **Cancel** - Closes modal without saving
  - **Save Changes** - Updates admin account

**Behavior**:
- Changing status to "Inactive" prevents admin from logging in
- Email change sends notification to old and new email addresses
- Modal closes after successful update
- Success toast: "Admin account updated successfully"

**"Delete Admin" Confirmation**:

Triggered by clicking delete icon on table row.

**Modal Content**:
- Title: "Delete Admin Account"
- Message: "Are you sure you want to delete **[Admin Name]**'s account? This action cannot be undone."
- Admin details displayed: Name, Email, Role
- Buttons:
  - **Cancel** - Closes modal
  - **Delete** (red button) - Permanently deletes admin account

**Behavior**:
- Deleted admin cannot login
- All actions performed by deleted admin remain in logs (audit trail)
- Deleted admin's data archived (not hard deleted) for compliance
- Modal closes after successful deletion
- Success toast: "Admin account deleted successfully"

**Technical Requirements**:
- **API Endpoints**:
  - `GET /api/admin/roles?search=&role=&status=&page=&limit=` - Returns filtered admins
  - `POST /api/admin/roles` - Creates new admin account
  - `GET /api/admin/roles/:adminId` - Returns specific admin details
  - `PUT /api/admin/roles/:adminId` - Updates admin account
  - `DELETE /api/admin/roles/:adminId` - Soft-deletes admin account
  - `PUT /api/admin/roles/:adminId/status` - Toggles active/inactive status

- **Password Generation**: Use Django's `make_random_password()` or similar
- **Email Notifications**: Send welcome email with login credentials to new admin
- **Audit Logging**: Log all admin account changes (created, updated, deleted, status changed)

**Permission Enforcement**:
- **Frontend**: Hide "Admin Roles" nav link for non-Master admins
- **Backend**: Validate JWT role on all endpoints (return 403 if not Master Admin)

**Acceptance Criteria**:
- [ ] Page only accessible to Master Admin
- [ ] Non-Master admins redirected with error if they try to access
- [ ] Search and filters work correctly
- [ ] Table displays all admins with correct roles and statuses
- [ ] "+ Add Admin" opens modal correctly
- [ ] Create form validates all fields
- [ ] Password auto-generated and copyable
- [ ] New admin receives welcome email
- [ ] Edit modal pre-fills with correct data
- [ ] Edit form validates all fields
- [ ] Status toggle works correctly
- [ ] Inactive admins cannot login
- [ ] Delete shows confirmation modal
- [ ] Delete permanently removes admin (soft delete)
- [ ] Success/error messages displayed for all actions
- [ ] Audit logs created for all changes

**Email Template for New Admin**:
```
Subject: Your PawPal Admin Account

Hi [Name],

A Master Admin has created an admin account for you on PawPal.

Your Login Details:
Email: [Email]
Temporary Password: [Generated Password]

Please login and change your password immediately:
[Admin Login URL]

Your Role: [Veterinarian/Front Desk]

Best regards,
The PawPal Team
```

**UI Components Needed**:
- Admin table component
- "Add Admin" modal with form
- "Edit Admin" modal with form
- Delete confirmation modal
- Role badge component
- Password generator utility
- Copy-to-clipboard button

---

### 2.7 Announcements Page

**Priority**: 🟢 LOW

**Access**: Master Admin, Veterinarian, Front Desk

**Description**: Admins can create, edit, and delete announcements/promotions that are visible to pet owners on the client-facing side.

**Page Layout**:

**Header**:
- Title: "Announcement Management"
- Megaphone icon for visual context
- **"+ New Announcement" button** (purple, right-aligned)

**Announcements Display**:

Each announcement displayed as a **card** with:
- **Title** (bold, large text)
- **Validity** (e.g., "Valid until: July 30, 2025" or "Ongoing")
- **Description** (brief summary, 2-3 lines)
- **Icon** (left side, based on type):
  - Syringe icon for vaccinations
  - Medical clipboard for wellness programs
  - Paw print for general/welcome offers
- **Action buttons** (right side):
  - Edit icon (opens edit modal)
  - Delete icon (opens delete confirmation)

**Card Design**:
- Rounded corners (12px)
- White background with light gray border
- Purple accent for icons and buttons
- Hover effect: subtle shadow

**No Announcements State**:
- Display message: "No announcements yet. Create your first announcement!"
- Illustration or icon
- "+ New Announcement" button (center)

---

**"New Announcement" Modal**:

Triggered by "+ New Announcement" button.

**Modal Content**:
- Title: "Create New Announcement"
- Form fields:
  - **Announcement Title** (text input, required, max 100 chars)
    - Example: "Summer Vaccination Special"
  - **Validity** (date input or "Ongoing" checkbox)
    - If date selected: Shows date picker
    - If "Ongoing" checked: No expiry date
  - **Announcement Description** (textarea, required, max 500 chars)
    - Example: "Get 20% off all vaccinations during June and July..."
    - Character count displayed below
  - **Icon Type** (dropdown or icon selector, optional):
    - Vaccination (syringe)
    - Wellness (clipboard)
    - Welcome (paw print)
    - General (megaphone)
- Buttons:
  - **Cancel** - Closes modal
  - **Create Announcement** (purple) - Saves and displays announcement

**Behavior**:
- Announcement immediately visible to pet owners after creation
- If validity date is past, announcement automatically hidden from client side
- Modal closes after successful creation
- Success toast: "Announcement created successfully"

---

**"Edit Announcement" Modal**:

Triggered by clicking edit icon on announcement card.

**Modal Content**:
- Title: "Edit Announcement"
- Form fields (same as create, pre-filled):
  - Announcement Title (pre-filled)
  - Validity (pre-filled date or "Ongoing" checked)
  - Announcement Description (pre-filled)
  - Icon Type (pre-selected)
- Buttons:
  - **Cancel** - Closes modal
  - **Save Changes** (purple) - Updates announcement

**Behavior**:
- Changes reflected immediately on client side
- Modal closes after successful update
- Success toast: "Announcement updated successfully"

---

**"Delete Announcement" Confirmation**:

Triggered by clicking delete icon on announcement card.

**Modal Content**:
- Title: "Delete Announcement"
- Message: "Are you sure you want to delete this announcement?"
- Announcement title displayed for confirmation
- Buttons:
  - **Cancel** - Closes modal
  - **Delete** (red button) - Permanently deletes announcement

**Behavior**:
- Announcement removed from client side immediately
- Modal closes after successful deletion
- Success toast: "Announcement deleted successfully"

---

**Technical Requirements**:
- **API Endpoints**:
  - `GET /api/admin/announcements` - Returns all announcements
  - `POST /api/admin/announcements` - Creates new announcement
  - `PUT /api/admin/announcements/:id` - Updates announcement
  - `DELETE /api/admin/announcements/:id` - Deletes announcement
  - `GET /api/announcements/active` - Returns only active/valid announcements (for client side)

- **Validation**:
  - Title required, max 100 characters
  - Description required, max 500 characters
  - Validity date must be future date (if not "Ongoing")

- **Auto-Hide Logic**:
  - Backend checks validity date
  - Expired announcements not returned by `/api/announcements/active`
  - Admins can still see expired announcements (grayed out) with "Expired" badge

**Acceptance Criteria**:
- [ ] Page displays all announcements as cards
- [ ] "+ New Announcement" opens modal
- [ ] Create form validates all fields
- [ ] Character count displayed and enforced
- [ ] New announcement displays immediately
- [ ] Edit modal pre-fills with correct data
- [ ] Edit updates announcement correctly
- [ ] Delete shows confirmation modal
- [ ] Deleted announcement removed immediately
- [ ] Expired announcements grayed out with "Expired" badge
- [ ] Active announcements visible on client side
- [ ] Success/error messages displayed for all actions
- [ ] Modal closes properly after actions

**Sample Announcements** (for initial data):

1. **Summer Vaccination Special**
   - Valid until: July 30, 2025
   - Description: "Get 20% off all vaccinations during June and July. Keep your pets protected for less!"
   - Icon: Syringe

2. **Senior Pet Wellness Month**
   - Valid until: August 15, 2025
   - Description: "Comprehensive check-ups for senior pets at a special rate. Includes blood work and arthritis screening."
   - Icon: Clipboard

3. **New Client Welcome Package**
   - Validity: Ongoing
   - Description: "First-time clients receive 15% off their initial consultation and a free pet care kit."
   - Icon: Paw print

**UI Components Needed**:
- Announcement card component
- "New Announcement" modal with form
- "Edit Announcement" modal with form
- Delete confirmation modal
- Icon selector component
- Character counter component
- Date picker component

---

### 2.8 Admin Profile Settings & Logout

**Priority**: 🟢 LOW

**Access**: Master Admin, Veterinarian, Front Desk (All admin types)

**Description**: Admins can manage their personal profile, security settings, and logout through a profile menu accessible from the navigation bar.

**Profile Menu Location**:
- Top-right corner of navigation bar
- Admin avatar (circular photo or initials)
- Clicking avatar opens dropdown menu

**Dropdown Menu Options**:
- **Profile Settings** - Opens Profile Settings page/modal
- **Logout** - Triggers logout confirmation modal

---

**Profile Settings Page/Modal**:

**Layout**:

*Profile Information Section* (top):
- **Profile Image**:
  - Circular photo placeholder
  - Camera icon overlay for editing
  - Click to upload new photo (JPG, PNG, max 2MB)
- **Name**: [Admin Name]
- **Role**: [Badge showing Master Admin/Veterinarian/Front Desk]
- **Clinic Information**: [Clinic name, if applicable]
- **Email Address**: [Email]
- **Contact Number**: [Masked: +63 9** *** **98]

*Security Info Section* (light yellow background box):
- Title: "Security Information"

- **Password Row**:
  - Label: "Password"
  - Value: "Last updated: [Date]"
  - Button: "Change" (purple) - Opens change password modal

- **Recovery Email Row**:
  - Label: "Recovery Email"
  - Value: 
    - If configured: Shows email
    - If not configured: Red "Not Configured" label
  - Button:
    - "Add" (if not configured)
    - "Edit" (if configured)
  - Opens recovery email modal

---

**Change Password Modal**:

**Modal Content**:
- Title: "Change Password"
- Form fields:
  - **Current Password** (password input, required)
  - **New Password** (password input, required)
    - Password strength indicator (Weak/Medium/Strong)
    - Requirements displayed:
      - Minimum 8 characters
      - At least 1 uppercase letter
      - At least 1 lowercase letter
      - At least 1 number
      - At least 1 special character
  - **Confirm New Password** (password input, required)
    - Must match new password
- Buttons:
  - **Cancel** - Closes modal
  - **Update Password** (purple) - Saves new password

**Behavior**:
- Validate current password before allowing change
- Enforce password requirements (see Business Rules section)
- Cannot use same as last 3 passwords
- All sessions invalidated after password change (user must login again)
- Success message: "Password updated successfully. Please login again."
- Redirect to login page

---

**Recovery Email Modal**:

**Modal Content**:
- Title: "Add/Edit Recovery Email"
- Description: "This email will be used to recover your account if you forget your password."
- Form fields:
  - **Recovery Email** (email input, required)
    - Must be different from primary email
    - Validation: Must be valid email format
  - **Confirm Recovery Email** (email input, required)
    - Must match recovery email
- Buttons:
  - **Cancel** - Closes modal
  - **Save** (purple) - Saves recovery email

**Behavior**:
- Send verification email to recovery email address
- Recovery email not active until verified
- User receives confirmation email at primary email
- Success message: "Recovery email added. Please check your email to verify."

---

**Logout Confirmation Modal**:

Triggered by clicking "Logout" in profile menu.

**Modal Content**:
- Title: "Logout"
- Message: "Are you sure you want to Logout?"
- Blurred background overlay
- Buttons:
  - **Cancel** - Closes modal, returns to current page
  - **Logout** (purple) - Confirms and ends session

**Behavior**:
- JWT token invalidated
- Session cleared from browser
- Redirect to admin login page
- Show toast: "You have been logged out successfully"

---

**Technical Requirements**:
- **API Endpoints**:
  - `GET /api/admin/profile` - Returns current admin profile data
  - `PUT /api/admin/profile` - Updates profile information
  - `PUT /api/admin/profile/photo` - Uploads new profile photo
  - `POST /api/admin/change-password` - Updates password
  - `POST /api/admin/recovery-email` - Sets/updates recovery email
  - `POST /api/admin/recovery-email/verify` - Verifies recovery email (from email link)
  - `POST /api/admin/logout` - Invalidates JWT token

- **File Upload**: Profile photo stored in chosen storage solution
- **Image Processing**: Resize uploaded photos to 200x200px
- **Session Management**: Invalidate all sessions after password change

**Acceptance Criteria**:
- [ ] Profile menu accessible from all admin pages
- [ ] Dropdown shows Profile Settings and Logout options
- [ ] Profile Settings displays all admin information correctly
- [ ] Profile photo upload works (with preview)
- [ ] Change Password modal validates all requirements
- [ ] Password strength indicator works correctly
- [ ] Cannot reuse last 3 passwords
- [ ] All sessions invalidated after password change
- [ ] Recovery email modal validates email format
- [ ] Verification email sent to recovery email
- [ ] Logout confirmation modal displays correctly
- [ ] Logout clears session and redirects to login
- [ ] All modals close properly
- [ ] Success/error messages displayed for all actions

**Email Template for Recovery Email Verification**:
```
Subject: Verify Your Recovery Email

Hi [Name],

Please verify your recovery email address by clicking the link below:

[Verification Link]

This link will expire in 24 hours.

If you didn't add this recovery email, please secure your account immediately.

Best regards,
The PawPal Team
UI Components Needed:
•	Profile dropdown menu component
•	Profile settings page/modal
•	Change password modal with strength indicator
•	Recovery email modal
•	Logout confirmation modal
•	Image upload component with preview
•	Password strength indicator component
________________________________________
SECTION 3: ROLE-BASED ACCESS SUMMARY
Master Admin
Full System Access:
•	Dashboard ✓
•	Reports ✓
•	Clients (Full access: View, Edit, Verify, Deactivate) ✓
•	Pets (Full access) ✓
•	Admin Roles (Exclusive access) ✓
•	Announcements (Full access: Create, Edit, Delete) ✓
•	Profile Settings ✓
Veterinarian Admin
Limited System Access:
•	Dashboard ✓
•	Reports ✓
•	Clients (View, Edit, Verify, Deactivate) ✓
•	Pets (Full access) ✓
•	Admin Roles ✗ (No access)
•	Announcements (Full access: Create, Edit, Delete) ✓
•	Profile Settings ✓
Front Desk Admin
Basic System Access:
•	Dashboard ✓
•	Reports ✓
•	Clients (View only, Send Email only) ✓
•	Pets (View only) ✓
•	Admin Roles ✗ (No access)
•	Announcements (Full access: Create, Edit, Delete) ✓
•	Profile Settings ✓
Pet Owner
Client Portal Access:
•	Dashboard (Personal pet dashboard) ✓
•	AI Symptom Checker ✓
•	View own SOAP Reports ✓
•	View own pet records ✓
•	Manage profile ✓
•	No admin access ✗
________________________________________
SECTION 4: ERROR HANDLING & EDGE CASES
OTP System
Error Scenarios:
•	Email delivery failure: "Unable to send email. Please check your email address and try again."
•	Expired OTP: "This code has expired. Please request a new code."
•	Invalid OTP: "Invalid code. [X] attempts remaining."
•	Max attempts exceeded: "Too many failed attempts. Please wait 5 minutes and request a new code."
•	Rate limit exceeded: "Too many OTP requests. Please try again in [X] minutes."
Handling:
•	Log all failed attempts for security monitoring
•	Display clear, user-friendly error messages
•	Provide "Resend OTP" option after expiry
•	Show countdown timer during cooldown period
AI Diagnosis System
Error Scenarios:
•	AI model timeout (>30s): "We're experiencing high demand. Please try again in a few minutes."
•	AI model returns error: "Unable to generate diagnosis. Please check your symptoms and try again."
•	Insufficient symptoms provided: "Please provide at least 2 symptoms for accurate analysis."
•	Network connectivity error: "Connection lost. Your data is saved. Please refresh and try again."
•	Image upload failure: "Unable to process image. Please ensure it's a valid JPG/PNG file under 5MB."
Handling:
•	Save user input even if AI fails (don't lose data)
•	Provide option to retry without re-entering all information
•	Show loading state with timeout indicator
•	Log all errors for debugging
Admin Operations
Error Scenarios:
•	Unauthorized access attempt: Redirect to login with "Access denied" message
•	Token expired: Redirect to login with "Session expired. Please login again."
•	Duplicate email on admin creation: "An admin with this email already exists."
•	Cannot delete last Master Admin: "Cannot delete the only Master Admin account."
•	Network error during save: "Changes not saved. Please check your connection and try again."
Handling:
•	Validate permissions on both frontend and backend
•	Show loading states during all operations
•	Provide clear error messages
•	Auto-retry for network errors (max 3 attempts)
File Operations (continued)
Error Scenarios (continued):
•	Download failure: "Unable to download file. Please try again."
•	ZIP creation failure: "Unable to create ZIP file. Please download files individually."
•	Storage quota exceeded: "Storage limit reached. Please contact support."
Handling:
•	Validate file size and type on frontend before upload
•	Show upload progress bar
•	Provide fallback for failed ZIP downloads (individual file downloads)
•	Clear error messages with actionable solutions
________________________________________
SECTION 5: DESIGN SYSTEM & UI SPECIFICATIONS
Color Palette
Primary Colors:
•	Deep Purple: #6B46C1 (Navigation, primary buttons, accents)
•	Light Purple: #9F7AEA (Hover states, secondary elements)
•	Very Light Purple: #E9D8FD (Backgrounds, highlights)
Semantic Colors:
•	Success/Active: #48BB78 (Green)
•	Warning/Moderate: #ECC94B (Yellow)
•	Urgent: #ED8936 (Orange)
•	Error/Emergency: #F56565 (Red)
•	Inactive: #A0AEC0 (Gray)
Neutral Colors:
•	Background: #F7FAFC (Light gray)
•	Card Background: #FFFFFF (White)
•	Text Primary: #2D3748 (Dark gray)
•	Text Secondary: #718096 (Medium gray)
•	Border: #E2E8F0 (Light gray)
Typography
Font Family: Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
Font Sizes:
•	Headings H1: 32px (bold)
•	Headings H2: 24px (semi-bold)
•	Headings H3: 20px (semi-bold)
•	Body Large: 16px (regular)
•	Body: 14px (regular)
•	Small: 12px (regular)
•	Tiny: 10px (regular)
Line Heights:
•	Headings: 1.2
•	Body: 1.5
•	Small text: 1.4
Spacing System
Use multiples of 4px:
•	xs: 4px
•	sm: 8px
•	md: 16px
•	lg: 24px
•	xl: 32px
•	2xl: 48px
•	3xl: 64px
Component Specifications
Buttons:
•	Primary: Purple background, white text, 12px border-radius 
o	Padding: 12px 24px
o	Hover: Darker purple
o	Active: Even darker purple with slight scale
•	Secondary: White background, purple border, purple text 
o	Padding: 12px 24px
o	Hover: Light purple background
•	Danger: Red background, white text 
o	Used for destructive actions (delete, deactivate)
Input Fields:
•	Border: 1px solid #E2E8F0
•	Border-radius: 8px
•	Padding: 10px 12px
•	Focus: Purple border (#6B46C1), purple shadow
•	Error state: Red border, red text below
Cards:
•	Background: White
•	Border: 1px solid #E2E8F0 or none
•	Border-radius: 12px
•	Shadow: 0 1px 3px rgba(0,0,0,0.1)
•	Hover shadow: 0 4px 6px rgba(0,0,0,0.1)
•	Padding: 20px
Badges:
•	Border-radius: 12px (pill shape)
•	Padding: 4px 12px
•	Font size: 12px
•	Font weight: Semi-bold
•	Colors based on status (see semantic colors)
Modals:
•	Background overlay: rgba(0,0,0,0.5) with backdrop blur
•	Modal background: White
•	Border-radius: 16px
•	Max-width: 600px (forms), 900px (data views)
•	Padding: 32px
•	Box-shadow: 0 20px 25px rgba(0,0,0,0.15)
Tables:
•	Header: Light gray background (#F7FAFC)
•	Header text: Bold, dark gray
•	Row height: 56px
•	Border: 1px solid #E2E8F0 (horizontal only)
•	Hover: Light purple background (#F7F3FF)
•	Zebra striping: Optional, alternate rows light gray
Navigation Bar:
•	Height: 64px
•	Background: Deep purple (#6B46C1)
•	Text color: White
•	Active link: White with underline or background highlight
•	Logo size: 40px height
•	Avatar size: 36px (circular)
Icons
Icon Library: Lucide React (https://lucide.dev/)
Common Icons:
•	Search: Search
•	Filter: Filter
•	Add: Plus
•	Edit: Edit2 or Pencil
•	Delete: Trash2
•	View: Eye
•	Download: Download
•	Upload: Upload
•	Close: X
•	Check: Check
•	Warning: AlertTriangle
•	Info: Info
•	User: User
•	Pet/Animal: PawPrint (custom or use Dog icon)
•	Medical: Activity or Heart
•	Chat: MessageCircle
•	Settings: Settings
•	Logout: LogOut
Icon Sizes:
•	Small: 16px
•	Medium: 20px
•	Large: 24px
•	Extra Large: 32px
Responsive Breakpoints
css
/* Mobile */
@media (max-width: 640px) { /* sm */ }

/* Tablet */
@media (min-width: 641px) and (max-width: 1024px) { /* md */ }

/* Desktop */
@media (min-width: 1025px) { /* lg */ }

/* Large Desktop */
@media (min-width: 1280px) { /* xl */ }
```

**Responsive Behavior**:
- **Mobile**: Not primary target (inform users to use desktop)
- **Tablet**: Dashboard sidebar stacks below main content, tables scroll horizontally
- **Desktop**: Full two-column layouts, all features accessible

### Animation & Transitions

**Durations**:
- Fast: 150ms (hover states, small movements)
- Medium: 300ms (modals, dropdowns, page transitions)
- Slow: 500ms (large animations, loading states)

**Easing**:
- Standard: `cubic-bezier(0.4, 0.0, 0.2, 1)`
- Decelerate: `cubic-bezier(0.0, 0.0, 0.2, 1)` (entering elements)
- Accelerate: `cubic-bezier(0.4, 0.0, 1, 1)` (exiting elements)

**Common Transitions**:
- Button hover: `background-color 150ms ease`
- Modal enter: Fade in + scale from 95% to 100%
- Modal exit: Fade out + scale to 95%
- Dropdown: Slide down with fade in
- Toast notifications: Slide in from top-right, auto-dismiss after 5s

### Loading States

**Spinners**:
- Small: 16px diameter
- Medium: 24px diameter
- Large: 48px diameter
- Color: Purple or white (on dark backgrounds)
- Animation: Continuous rotation

**Skeleton Screens**:
- Use for tables and cards while loading data
- Animated gradient shimmer effect
- Match layout of actual content

**Progress Bars**:
- Use for file uploads
- Height: 8px
- Border-radius: 4px
- Background: Light gray
- Progress: Purple with animation

### Accessibility

**Requirements**:
- All interactive elements keyboard accessible (Tab, Enter, Escape)
- Focus indicators visible (purple outline, 2px)
- ARIA labels on icons without text
- Sufficient color contrast (WCAG AA minimum)
- Form inputs associated with labels
- Error messages announced to screen readers
- Modal traps focus while open
- Skip navigation links for screen readers

**Color Contrast Ratios**:
- Normal text: 4.5:1 minimum
- Large text (18px+): 3:1 minimum
- UI components: 3:1 minimum
API Response Format
Success Response:
json
{
  "success": true,
  "data": {
    // Requested data
  },
  "message": "Operation successful" // Optional
}
Error Response:
json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid input provided",
    "details": {
      "email": ["Email is required"],
      "password": ["Password must be at least 8 characters"]
    }
  }
}
Paginated Response:
json
{
  "success": true,
  "data": {
    "results": [ /* Array of items */ ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 100,
      "totalPages": 10,
      "hasNext": true,
      "hasPrev": false
    }
  }
}
Error Codes
Authentication Errors (401):
•	AUTH_INVALID_CREDENTIALS - Wrong email/password
•	AUTH_TOKEN_EXPIRED - JWT expired
•	AUTH_TOKEN_INVALID - JWT malformed
•	AUTH_UNAUTHORIZED - Not logged in
Authorization Errors (403):
•	PERMISSION_DENIED - Insufficient permissions
•	ROLE_REQUIRED - Specific role required
•	RESOURCE_FORBIDDEN - Cannot access this resource
Validation Errors (400):
•	VALIDATION_ERROR - Input validation failed
•	MISSING_REQUIRED_FIELD - Required field not provided
•	INVALID_FORMAT - Data format incorrect
Resource Errors (404):
•	RESOURCE_NOT_FOUND - Requested resource doesn't exist
Business Logic Errors (422):
•	OTP_EXPIRED - OTP code expired
•	OTP_INVALID - OTP code incorrect
•	OTP_MAX_ATTEMPTS - Too many OTP attempts
•	EMAIL_ALREADY_EXISTS - Duplicate email
•	CANNOT_DELETE_LAST_ADMIN - Business rule violation
Server Errors (500):
•	INTERNAL_SERVER_ERROR - Unexpected server error
•	EMAIL_SEND_FAILED - Email service failed
•	FILE_UPLOAD_FAILED - File upload failed
•	Admin:
•	python
•	class Admin(models.Model):
•	    ROLE_CHOICES = [
•	        ('MASTER', 'Master Admin'),
•	        ('VET', 'Veterinarian'),
•	        ('DESK', 'Front Desk'),
•	    ]
•	    email = models.EmailField(unique=True)
•	    password = models.CharField(max_length=255)
•	    name = models.CharField(max_length=100)
•	    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
•	    is_active = models.BooleanField(default=True)
•	    profile_image = models.ImageField(upload_to='admin_profiles/', null=True)
•	    recovery_email = models.EmailField(null=True, blank=True)
•	    password_updated_at = models.DateTimeField(auto_now_add=True)
•	    created_at = models.DateTimeField(auto_now_add=True)

SOAPReport:
python
class SOAPReport(models.Model):
    case_id = models.CharField(max_length=30, unique=True)
    pet = models.ForeignKey(Pet, on_delete=models.CASCADE)
    chat_conversation = models.ForeignKey('ChatConversation', on_delete=models.SET_NULL, null=True)
    subjective = models.TextField()
    objective = models.JSONField()  # {symptoms: [], duration: ""}
    assessment = models.JSONField()  # [{condition, likelihood, urgency, ...}]
    plan = models.JSONField()  # {severityLevel, careAdvice: []}
    flag_level = models.CharField(max_length=20)  # Moderate|Urgent|Emergency
    date_generated = models.DateTimeField(auto_now_add=True)
    date_flagged = models.DateTimeField(auto_now_add=True)
OTP:
python
class OTP(models.Model):
    PURPOSE_CHOICES = [
        ('ACCOUNT', 'Account Creation'),
        ('PASSWORD', 'Password Reset'),
    ]
    email = models.EmailField()
    code = models.CharField(max_length=6)
    purpose = models.CharField(max_length=10, choices=PURPOSE_CHOICES)
    attempts = models.IntegerField(default=0)
    is_verified = models.BooleanField(default=False)
    expires_at = models.DateTimeField()
    created_at = models.DateTimeField(auto_now_add=True)
Announcement:
python
class Announcement(models.Model):
    title = models.CharField(max_length=100)
    description = models.TextField(max_length=500)
    valid_until = models.DateField(null=True, blank=True)  # Null = Ongoing
    icon_type = models.CharField(max_length=20)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
Security Best Practices
1.	Always use Django ORM - Never construct raw SQL queries
2.	Validate all inputs - Use Django forms/serializers
3.	Hash passwords - Use Django's make_password() and check_password()
4.	Use JWT for API auth - Include role in token payload
5.	Implement rate limiting - Especially on OTP and login endpoints
6.	Sanitize user inputs - Prevent XSS attacks
7.	Use HTTPS only - In production
8.	Set secure headers - CORS, CSP, X-Frame-Options
9.	Log security events - Failed logins, permission denials
10.	Regular dependency updates - Keep Django and packages updated
Testing Checklist
Unit Tests:
•	OTP generation and validation
•	Password hashing and verification
•	Flag level calculation
•	Case ID generation
•	Email formatting
Integration Tests:
•	User registration with OTP
•	Password reset flow
•	Admin login
•	SOAP report creation
•	File upload and download
E2E Tests (Critical paths):
•	Pet owner registers → verifies email → logs in
•	Pet owner uses symptom checker → receives SOAP report
•	Master Admin creates veterinarian account
•	Veterinarian logs in → views flagged cases → opens SOAP report
•	Admin creates announcement → pet owner sees it
________________________________________
SECTION 8: EXTERNAL DEPENDENCIES & RECOMMENDATIONS
Email Service Options
Recommended: SendGrid (Free tier: 100 emails/day)
•	Pros: Easy setup, reliable, good documentation
•	Cons: Requires API key, limited free tier
Alternative: AWS SES
•	Pros: Cheap ($0.10/1000 emails), scalable
•	Cons: More complex setup, requires AWS account
For Development: Django Console Backend
python
# settings.py
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'
File Storage Options
For Development: Local Storage
python
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')
```

**For Production: AWS S3** (Recommended)
- Use `django-storages` package
- Configure S3 bucket with proper permissions

**Alternative: Cloudinary**
- Good for images specifically
- Free tier: 25GB storage

### Frontend Libraries

**Already Mentioned**:
- React (core framework)
- Lucide React (icons)
- Recharts (charts)

**Additional Recommendations**:
- **React Router** - Page navigation
- **Axios** - HTTP requests
- **React Query** - API state management
- **React Hook Form** - Form validation
- **date-fns** - Date formatting
- **jsPDF** or **react-pdf** - PDF generation
- **react-dropzone** - File uploads
- **react-toastify** - Toast notifications

### Backend Packages

**Required**:
```
Django>=4.2
djangorestframework
djangorestframework-simplejwt
psycopg2-binary (PostgreSQL)
Pillow (image processing)
python-decouple (environment variables)
django-cors-headers
```

**Recommended**:
```
django-filter (advanced filtering)
drf-yasg (API documentation)
celery (background tasks for email)
redis (caching and Celery broker)
________________________________________
SECTION 9: ACCEPTANCE CRITERIA SUMMARY
Pet Owner Side
OTP Verification (Account Creation):
•	User can register with email
•	6-digit OTP generated and sent
•	OTP expires after 10 minutes
•	Max 3 verification attempts
•	Successful verification redirects to login
•	"Resend OTP" available after expiry
OTP Verification (Password Reset):
•	User can request password reset
•	OTP sent to registered email
•	Valid OTP redirects to create new password page
•	Password successfully updated
•	User redirected to login after reset
AI Diagnosis Report:
•	Loading modal displays during processing
•	Success modal shows pet name dynamically
•	SOAP report displays all sections correctly
•	Report is print-friendly
•	Report saved to pet's medical history
Flagging System:
•	Flag level calculated automatically
•	Flagged cases visible on admin dashboard
•	Pet owner does NOT see flag level
Admin Side
Authentication:
•	Admin can login with credentials
•	JWT token generated with role
•	Session expires after inactivity
•	Password reset available (non-Master admins)
Dashboard:
•	Summary cards display correct counts
•	Recently Added Pets shows last 5
•	Flagged Cases color-coded by severity
•	Charts display accurate data
•	Admin Roles link only visible to Master Admin
Reports Page:
•	All SOAP reports displayed in table
•	Search and filters work correctly
•	Clicking report opens full view
•	Print and PDF export functional
Clients Page:
•	All clients displayed in table
•	Search and filters work
•	Client detail modal shows all info
•	Edit, verify, deactivate functions work
•	Send email functionality works
•	Front Desk cannot edit/deactivate
Pets Page:
•	All pets displayed in table
•	Pet Medical Record page shows complete data
•	Medical records and vaccinations display
•	AI diagnosis section functional
•	Chat history clickable
•	Files downloadable individually and as ZIP
Admin Roles (Master Admin Only):
•	All admins displayed in table
•	Create admin modal works
•	Password auto-generated
•	Welcome email sent to new admin
•	Edit admin modal works
•	Delete confirmation modal works
•	Non-Master admins cannot access page
Announcements:
•	All announcements displayed as cards
•	Create announcement modal works
•	Edit announcement modal works
•	Delete confirmation modal works
•	Expired announcements marked correctly
Profile Settings:
•	Profile information displays correctly
•	Change password modal works
•	Password requirements enforced
•	Recovery email modal works
•	Profile photo upload works
•	Logout confirmation modal works
________________________________________
SECTION 10: NOTES FOR CURSOR AI
Context You Already Have
•	Tech stack: React frontend, Django backend, PostgreSQL database
•	Existing system with some features already implemented
•	This document describes MISSING features only
What to Implement
1.	Do NOT implement Random Forest training - That's in a separate prompt
2.	Assume ML model API endpoint exists: POST /api/ml/predict
3.	Focus on UI/UX, CRUD operations, admin features
4.	Follow the phase-by-phase approach in Section 6
Key Priorities
1.	Phase 1: OTP system and admin auth (foundation)
2.	Phase 2: AI diagnosis display (high-value feature)
3.	Phase 3: Admin pages (core functionality)
4.	Phase 4-5: Admin management and announcements
5.	Phase 6: Polish and testing
Design Consistency
•	Use the color palette, typography, and component specs in Section 5
•	All modals should have blurred background overlay
•	All tables should be sortable and paginated
•	All forms should have validation and error messages
•	All actions should have loading states and success/error feedback
Code Quality
•	Write clean, readable, well-commented code
•	Use React hooks (functional components only)
•	Use Django REST Framework serializers for validation
•	Implement proper error handling everywhere
•	Create reusable components
Security
•	Always validate permissions on backend
•	Use Django ORM (no raw SQL)
•	Hash passwords with Django's built-in functions
•	Implement rate limiting on sensitive endpoints
•	Sanitize all user inputs
Testing
•	Write unit tests for critical functions
•	Test all API endpoints
•	Ensure role-based access control works
•	Test OTP expiry and validation
•	Test file uploads and downloads
Questions to Ask User
If anything is unclear:
•	Email service preference (SendGrid, AWS SES, or other)
•	File storage preference (AWS S3, Cloudinary, or local)
•	Any existing authentication system to integrate with
•	Any specific Django packages already in use
•	Current database schema (to avoid conflicts)
FINAL CHECKLIST
Before considering implementation complete, verify:
Pet Owner Side:
•	OTP account creation works end-to-end
•	OTP password reset works end-to-end
•	AI diagnosis displays correctly with proper formatting
•	SOAP reports are printable and professional-looking
Admin Side:
•	All 3 admin roles can login
•	Dashboard displays real-time data
•	Reports page shows all SOAP reports with filters
•	Clients page allows full client management
•	Pets page shows complete medical records
•	Admin Roles page works (Master Admin only)
•	Announcements page functional
•	Profile settings and logout work
Cross-Cutting:
•	Role-based access control enforced everywhere
•	All forms validate inputs
•	All API errors handled gracefully
•	All actions have loading states
•	All success/error messages display correctly
•	Email service configured and working
•	File uploads/downloads work
•	Design system consistent across all pages
•	Responsive on desktop and tablet
•	No console errors in browser
•	No 500 errors from backend
Security (continued):
•	Passwords hashed and never stored in plain text
•	SQL injection prevented (using ORM only)
•	XSS protection implemented
•	CSRF protection enabled
•	File uploads validated (type and size)
•	Admin permissions checked on backend for every request
•	Sensitive data (passwords, OTPs) never logged
•	HTTPS enforced in production
Performance:
•	Database queries optimized (no N+1 queries)
•	Images compressed and optimized
•	Large tables paginated
•	API responses cached where appropriate
•	Loading states prevent multiple submissions
•	File downloads streamed (not loaded into memory)
User Experience:
•	Clear error messages for all failure cases
•	Success feedback for all actions
•	Confirmation modals for destructive actions
•	Breadcrumbs or back buttons for navigation
•	Empty states shown when no data exists
•	Search results show "No results found" message
•	Forms retain data after validation errors
•	Keyboard navigation works throughout
________________________________________
APPENDIX A: SAMPLE DATA FOR TESTING
Sample Pet Owners
json
[
  {
    "name": "Mal Beausoleil",
    "email": "mal.beausoleil@example.com",
    "phone": "09453419798",
    "city_province": "Santa Rosa City, Laguna",
    "address": "123 Sample Street, Santa Rosa",
    "status": "Active"
  },
  {
    "name": "Sarah Johnson",
    "email": "sarah.j@example.com",
    "phone": "09171234567",
    "city_province": "Quezon City, Metro Manila",
    "address": "456 Test Avenue, QC",
    "status": "Active"
  }
]
Sample Pets
json
[
  {
    "name": "Charlie",
    "owner": "Mal Beausoleil",
    "pet_id": "RP-06-001",
    "species": "Cat",
    "breed": "Domestic Shorthair",
    "sex": "Male",
    "age": "2 years old",
    "blood_type": "Type A",
    "spayed_neutered": false,
    "allergies": "Flea Allergy Dermatitis",
    "chronic_disease": null
  },
  {
    "name": "Max",
    "owner": "Sarah Johnson",
    "pet_id": "RP-06-002",
    "species": "Dog",
    "breed": "Golden Retriever",
    "sex": "Male",
    "age": "4 years old",
    "blood_type": "DEA 1.1 Positive",
    "spayed_neutered": true,
    "allergies": null,
    "chronic_disease": "Hip Dysplasia"
  }
]
Sample Admin Accounts
json
[
  {
    "name": "Dr. Maria Santos",
    "email": "maria.santos@pawpal.com",
    "role": "Master Admin",
    "status": "Active"
  },
  {
    "name": "Dr. Hazel Liwanag",
    "email": "hazel.liwanag@pawpal.com",
    "role": "Veterinarian",
    "status": "Active"
  },
  {
    "name": "John Dela Cruz",
    "email": "john.delacruz@pawpal.com",
    "role": "Front Desk",
    "status": "Active"
  }
]
Sample SOAP Report Data
json
{
  "case_id": "#PDX-2025-0604-001",
  "pet_name": "Charlie",
  "owner_name": "Mal Beausoleil",
  "date_generated": "2025-06-04T14:30:00Z",
  "subjective": "Charlie, a 2-year-old domestic shorthair cat, has been sneezing frequently for the past 2 days. The owner reports watery eyes, reduced appetite, occasional nasal discharge, and mild lethargy—though Charlie remains somewhat active.",
  "objective": {
    "symptoms": ["sneezing", "watery eyes", "nasal discharge", "decreased appetite"],
    "duration": "2 days"
  },
  "assessment": [
    {
      "condition": "Feline Upper Respiratory Infection (URI)",
      "likelihood": 0.89,
      "description": "A common contagious infection caused by feline herpesvirus or calicivirus.",
      "matched_symptoms": ["Sneezing", "watery eyes", "nasal discharge", "decreased appetite"],
      "urgency": "Moderate",
      "contagious": true
    },
    {
      "condition": "Allergic Rhinitis",
      "likelihood": 0.45,
      "description": "Inflammation of nasal passages due to environmental allergens.",
      "matched_symptoms": ["Sneezing", "watery eyes"],
      "urgency": "Mild",
      "contagious": false
    },
    {
      "condition": "Feline Chlamydiosis",
      "likelihood": 0.30,
      "description": "A bacterial infection that affects the eyes and respiratory tract.",
      "matched_symptoms": ["Conjunctivitis", "sneezing", "discharge"],
      "urgency": "Moderate",
      "contagious": true
    }
  ],
  "plan": {
    "severity_level": "Moderate",
    "care_advice": [
      "Keep Charlie indoors and isolated from other cats.",
      "Wipe eyes and nose gently with a damp cloth.",
      "Offer warm, appetizing food to encourage eating.",
      "Use a humidifier or let Charlie stay in a steamy bathroom to ease congestion."
    ]
  },
  "flag_level": "Moderate"
}
Sample Announcements
json
[
  {
    "title": "Summer Vaccination Special",
    "description": "Get 20% off all vaccinations during June and July. Keep your pets protected for less!",
    "valid_until": "2025-07-30",
    "icon_type": "vaccination"
  },
  {
    "title": "Senior Pet Wellness Month",
    "description": "Comprehensive check-ups for senior pets at a special rate. Includes blood work and arthritis screening.",
    "valid_until": "2025-08-15",
    "icon_type": "wellness"
  },
  {
    "title": "New Client Welcome Package",
    "description": "First-time clients receive 15% off their initial consultation and a free pet care kit.",
    "valid_until": null,
    "icon_type": "welcome"
  }
]



Since I am working with another dev, make sure that env files are updated and are kept local so that collaboration is still possible.




DO THIS ALL NOW, no other prompts just this and complete everything here