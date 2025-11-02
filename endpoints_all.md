🔧 BACKEND ENDPOINTS - ORGANIZED BY CHUNKS

CHUNK 1: Pet Owner Authentication Endpoints 🟡 MEDIUM PRIORITY
Build these authentication endpoints for pet owners:

Endpoints to create:
1. POST /api/auth/register
   - Input: name, email, password, contact_info
   - Generate 6-digit OTP
   - Send OTP email (console backend for dev)
   - Return: user_id, message "OTP sent to email"

2. POST /api/auth/send-otp
   - Input: email, purpose (account_creation|password_reset)
   - Rate limit: Max 3 per hour per email
   - Generate new OTP, invalidate old ones
   - Send email
   - Return: success message

3. POST /api/auth/verify-otp
   - Input: email, otp_code, purpose
   - Validate: code matches, not expired (10 min), attempts < 3
   - If account_creation: activate user account
   - If password_reset: return token for password reset
   - Return: success, token (if needed)

4. POST /api/auth/request-password-reset
   - Input: email
   - Generate OTP with purpose="password_reset"
   - Send email
   - Return: generic success message (don't reveal if email exists)

5. POST /api/auth/reset-password
   - Input: email, otp_code, new_password
   - Verify OTP is valid
   - Hash new password
   - Invalidate all user sessions
   - Return: success message

6. POST /api/auth/login
   - Input: email, password
   - Validate credentials
   - Check account is active
   - Return: JWT token, user info

Models needed:
- OTP model (already exists per progress)
- Update User model with is_verified boolean

Business logic:
- OTP expires after 10 minutes
- Max 3 verification attempts
- 5-minute cooldown after 3 failed attempts
- Rate limiting: 3 OTP requests per hour per email
- Password must meet requirements (8+ chars, upper, lower, number, special)

Files to modify:
- users/models.py (OTP model exists, add any missing fields)
- users/views_otp.py (implement all views)
- users/serializers.py (create serializers for all endpoints)
- users/urls_auth.py (register routes)
- vet_app/settings.py (ensure email backend configured)
```

---

## **CHUNK 2: SOAP Report & Diagnosis Endpoints** 🔴 HIGH PRIORITY
```
Build diagnosis and SOAP report endpoints:

Endpoints to create:
1. POST /api/diagnosis/generate
   - Input: pet_id, symptoms[], duration, optional_image
   - Call ML model endpoint POST /api/ml/predict (assume exists)
   - Format ML response into SOAP report structure
   - Generate case_id: #PDX-YYYY-MMDD-XXX format
   - Calculate flag_level using flagging logic
   - Save SOAPReport to database
   - Link to chat_conversation_id if provided
   - Return: case_id, soap_report

2. GET /api/diagnosis/soap/:caseId
   - Retrieve complete SOAP report
   - Include pet info, owner info, all SOAP sections
   - Return: full SOAP report object

3. GET /api/diagnosis/:petId
   - Get all diagnoses for a specific pet
   - Order by date_generated DESC
   - Return: array of SOAP reports

4. GET /api/diagnosis/flagged/:petId
   - Get only flagged cases for a pet
   - Filter by flag_level (Emergency, Urgent, Moderate)
   - Return: array of flagged SOAP reports

Flagging Logic (implement as utility function):
def calculate_flag_level(assessment, symptoms):
    top_diagnosis = max(assessment, key=lambda x: x['likelihood'])
    likelihood = top_diagnosis['likelihood']
    urgency = top_diagnosis['urgency'].lower()
    
    # Emergency
    if likelihood >= 0.90 and urgency == 'severe':
        return 'Emergency'
    if any(s in ['seizure', 'difficulty breathing', 'severe bleeding'] for s in symptoms):
        return 'Emergency'
    
    # Urgent
    if likelihood >= 0.75 and urgency in ['moderate', 'severe']:
        return 'Urgent'
    
    # Moderate (default)
    if likelihood >= 0.60:
        return 'Moderate'
    
    return 'Moderate'

Case ID Generation:
def generate_case_id():
    from datetime import datetime
    today = datetime.now().strftime('%Y-%m%d')
    # Count existing cases for today
    count = SOAPReport.objects.filter(
        case_id__contains=f'PDX-{today}'
    ).count()
    return f'#PDX-{today}-{str(count + 1).zfill(3)}'

Models:
- SOAPReport (already exists per progress)
- Ensure fields: case_id, pet, subjective, objective, assessment, plan, flag_level, date_flagged

Files to modify:
- chatbot/models.py (SOAPReport model exists, verify fields)
- chatbot/views.py (implement diagnosis views)
- chatbot/serializers.py (create SOAP serializers)
- chatbot/urls.py (register routes)
- chatbot/utils.py (flagging logic, case ID generation)
```

---

## **CHUNK 3: Admin Authentication Endpoints** 🔴 HIGH PRIORITY
```
Build admin authentication system:

Endpoints to create:
1. POST /api/admin/login
   - Input: email, password
   - Validate against Admin model (separate from User)
   - Check is_active = True
   - Generate JWT with role embedded (MASTER, VET, DESK)
   - Return: token, admin_info (name, email, role)

2. POST /api/admin/logout
   - Invalidate JWT token
   - Clear session
   - Return: success message

3. POST /api/admin/verify-token
   - Input: JWT token
   - Validate token
   - Return: admin info if valid

4. POST /api/admin/change-password
   - Input: current_password, new_password
   - Validate current password
   - Check new password meets requirements
   - Check not in last 3 passwords
   - Hash and save
   - Invalidate all admin sessions
   - Return: success message

5. POST /api/admin/request-password-reset
   - Only for VET and DESK roles (NOT MASTER)
   - Input: email
   - Generate OTP
   - Send email
   - Return: success message

Admin Model (create if doesn't exist):
class Admin(models.Model):
    ROLE_CHOICES = [
        ('MASTER', 'Master Admin'),
        ('VET', 'Veterinarian'),
        ('DESK', 'Front Desk'),
    ]
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)  # hashed
    name = models.CharField(max_length=100)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES)
    is_active = models.BooleanField(default=True)
    profile_image = models.ImageField(upload_to='admin_profiles/', null=True, blank=True)
    recovery_email = models.EmailField(null=True, blank=True)
    clinic_info = models.CharField(max_length=255, null=True, blank=True)
    contact_number = models.CharField(max_length=20)
    password_updated_at = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)

Password History (track last 3):
class AdminPasswordHistory(models.Model):
    admin = models.ForeignKey(Admin, on_delete=models.CASCADE)
    password_hash = models.CharField(max_length=255)
    created_at = models.DateTimeField(auto_now_add=True)

JWT Configuration:
- Include role in token payload
- 8-hour expiration
- Refresh token optional

Files to create/modify:
- admin_panel/models.py (Admin, AdminPasswordHistory)
- admin_panel/views.py (auth views)
- admin_panel/serializers.py (admin serializers)
- admin_panel/urls.py (register auth routes)
- admin_panel/permissions.py (role-based permission decorators)
```

---

## **CHUNK 4: Admin Dashboard Endpoints** 🔴 HIGH PRIORITY
```
Build admin dashboard data endpoints:

Endpoints to create:
1. GET /api/admin/dashboard/stats
   - Permissions: MASTER, VET, DESK
   - Return counts:
     {
       "total_users": count,
       "total_pets": count,
       "total_reports": count (with filter: last_7_days, last_30_days, all_time),
       "total_conversations": count (with filter: this_week, this_month, all_time)
     }
   
2. GET /api/admin/dashboard/recent-pets
   - Permissions: MASTER, VET, DESK
   - Return last 5 registered pets
   - Include: pet_name, species, breed, owner_name, registration_date
   - Order by created_at DESC

3. GET /api/admin/dashboard/flagged-cases?filter=all|emergency|urgent|moderate
   - Permissions: MASTER, VET, DESK
   - Get SOAP reports filtered by flag_level
   - Include: pet_name, species, condition, likelihood, urgency, owner_name, date_flagged
   - Order by severity (Emergency > Urgent > Moderate), then date_flagged DESC
   - Return array of flagged cases

4. GET /api/admin/dashboard/charts
   - Permissions: MASTER, VET, DESK
   - Return chart data:
     {
       "species_breakdown": {
         "Dogs": count,
         "Cats": count,
         "Birds": count,
         "Rabbits": count,
         "Others": count
       },
       "common_symptoms": [
         {"symptom": "Sneezing", "count": 45},
         {"symptom": "Vomiting", "count": 32},
         ...top 10
       ],
       "symptoms_by_species": {
         "Dogs": ["symptom1", "symptom2"],
         "Cats": ["symptom1", "symptom2"],
         ...
       }
     }

5. GET /api/admin/dashboard/faqs
   - Permissions: MASTER, VET, DESK
   - Return hardcoded FAQ list (can move to database later)
   - Return:
     [
       {"question": "What services do you offer?", "answer": "..."},
       {"question": "How often should I bring my pet for check-ups?", "answer": "..."},
       ...
     ]

6. GET /api/admin/dashboard/announcements
   - Permissions: MASTER, VET, DESK
   - Get 2-3 active announcements (is_active=True, not expired)
   - Return: title, validity, description
   - Order by created_at DESC

Permission Decorator (create utility):
from functools import wraps
from rest_framework.response import Response

def require_admin_role(allowed_roles):
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            admin_role = request.user.role  # from JWT
            if admin_role not in allowed_roles:
                return Response(
                    {"error": "Permission denied"},
                    status=403
                )
            return view_func(request, *args, **kwargs)
        return wrapped_view
    return decorator

Files to modify:
- admin_panel/views.py (dashboard views)
- admin_panel/serializers.py (dashboard serializers)
- admin_panel/urls.py (register dashboard routes)
- admin_panel/permissions.py (permission decorators)
```

---

## **CHUNK 5: Admin Reports Endpoints** 🔴 HIGH PRIORITY
```
Build admin reports management endpoints:

Endpoints to create:
1. GET /api/admin/reports?search=&dateRange=&species=&flagLevel=&page=1&limit=10
   - Permissions: MASTER, VET, DESK
   - Query params:
     - search: pet name, owner name, case ID
     - dateRange: today, last_7_days, last_30_days, custom, all_time
     - species: all, dogs, cats, birds, rabbits, others
     - flagLevel: all, emergency, urgent, moderate
     - page, limit: pagination
   - Backend search (use Django Q objects)
   - Server-side pagination
   - Return:
     {
       "results": [
         {
           "case_id": "#PDX-2025-0604-001",
           "pet_name": "Charlie",
           "species": "Cat",
           "breed": "Domestic Shorthair",
           "owner_name": "Mal Beausoleil",
           "date_generated": "2025-06-04T14:30:00Z",
           "flag_level": "Moderate"
         },
         ...
       ],
       "pagination": {
         "page": 1,
         "limit": 10,
         "total": 100,
         "totalPages": 10,
         "hasNext": true,
         "hasPrev": false
       }
     }

2. GET /api/admin/reports/:caseId
   - Permissions: MASTER, VET, DESK
   - Get specific SOAP report by case_id
   - Include all sections: pet info, owner info, S-O-A-P
   - Return: complete SOAP report object

3. GET /api/admin/reports/flagged?filter=all|emergency|urgent|moderate
   - Permissions: MASTER, VET, DESK
   - Get all flagged cases filtered by severity
   - Return: array of flagged SOAP reports with full details

Search Implementation:
from django.db.models import Q

def search_reports(search_term, queryset):
    if search_term:
        queryset = queryset.filter(
            Q(pet__name__icontains=search_term) |
            Q(pet__owner__name__icontains=search_term) |
            Q(case_id__icontains=search_term)
        )
    return queryset

Files to modify:
- admin_panel/views.py (reports views)
- admin_panel/serializers.py (reports serializers)
- admin_panel/urls.py (register reports routes)
- admin_panel/filters.py (create custom filters)
```

---

## **CHUNK 6: Admin Clients Endpoints** 🔴 HIGH PRIORITY
```
Build client management endpoints:

Endpoints to create:
1. GET /api/admin/clients?search=&dateRange=&status=&page=1&limit=10
   - Permissions: MASTER, VET, DESK (view all)
   - Query params:
     - search: name, email
     - dateRange: today, last_7_days, last_30_days, custom, all_time
     - status: all, active, inactive, pending_verification
     - page, limit: pagination
   - Return:
     {
       "results": [
         {
           "user_id": "uuid",
           "name": "Mal Beausoleil",
           "email": "mal.beausoleil@example.com",
           "pet_count": 2,
           "status": "Active",
           "date_created": "2025-01-15T10:30:00Z"
         },
         ...
       ],
       "pagination": {...}
     }

2. GET /api/admin/clients/:userId
   - Permissions: MASTER, VET, DESK
   - Get detailed client info
   - Include registered pets (with photos, names, species, breeds)
   - Return:
     {
       "user_id": "uuid",
       "name": "Mal Beausoleil",
       "email": "mal.beausoleil@example.com",
       "contact_number": "09453419798",
       "city_province": "Santa Rosa City, Laguna",
       "address": "123 Sample Street",
       "status": "Active",
       "profile_image": "url",
       "date_joined": "2025-01-15T10:30:00Z",
       "pets": [
         {
           "pet_id": "RP-06-001",
           "name": "Charlie",
           "species": "Cat",
           "breed": "Domestic Shorthair",
           "photo": "url"
         },
         ...
       ]
     }

3. PUT /api/admin/clients/:userId
   - Permissions: MASTER, VET only (NOT DESK)
   - Input: name, email, contact_number, address, city_province
   - Validate email uniqueness
   - Update user info
   - Return: updated user object

4. POST /api/admin/clients/:userId/verify
   - Permissions: MASTER, VET only
   - Set user is_verified = True
   - Send verification confirmation email
   - Return: success message

5. POST /api/admin/clients/:userId/deactivate
   - Permissions: MASTER, VET only
   - Set user is_active = False
   - User cannot login while inactive
   - Return: success message

6. POST /api/admin/clients/:userId/email
   - Permissions: MASTER, VET, DESK
   - Input: subject, message
   - Send email to client using configured email service
   - Return: success message

Permission checks (add to each view):
@require_admin_role(['MASTER', 'VET'])  # for edit/verify/deactivate
@require_admin_role(['MASTER', 'VET', 'DESK'])  # for view/email

Files to modify:
- admin_panel/views.py (client management views)
- admin_panel/serializers.py (client serializers)
- admin_panel/urls.py (register client routes)
- admin_panel/email_templates.py (verification email template)
```

---

## **CHUNK 7: Admin Pets Endpoints** 🔴 HIGH PRIORITY
```
Build pet management endpoints:

Endpoints to create:
1. GET /api/admin/pets?search=&species=&status=&page=1&limit=10
   - Permissions: MASTER, VET, DESK
   - Query params:
     - search: pet name, owner name, pet ID
     - species: all, dogs, cats, birds, rabbits, others
     - status: all, active, inactive, deceased
     - page, limit: pagination
   - Return:
     {
       "results": [
         {
           "pet_id": "RP-06-001",
           "name": "Charlie",
           "species": "Cat",
           "breed": "Domestic Shorthair",
           "owner_name": "Mal Beausoleil",
           "status": "Active",
           "photo": "url",
           "registered_date": "2025-01-20T12:00:00Z"
         },
         ...
       ],
       "pagination": {...}
     }

2. GET /api/admin/pets/:petId
   - Permissions: MASTER, VET, DESK
   - Get complete pet medical record data
   - Return:
     {
       "pet_id": "RP-06-001",
       "name": "Charlie",
       "species": "Cat",
       "breed": "Domestic Shorthair",
       "sex": "Male",
       "age": "2 years old",
       "blood_type": "Type A",
       "spayed_neutered": false,
       "allergies": "Flea Allergy Dermatitis",
       "chronic_disease": null,
       "photo": "url",
       "owner": {
         "name": "Mal Beausoleil",
         "contact": "09453419798"
       },
       "registered_date": "2025-01-20T12:00:00Z"
     }

3. GET /api/admin/pets/:petId/medical-records?serviceType=all
   - Permissions: MASTER, VET, DESK
   - Filter by: all, checkup, laboratory, vaccination, surgery
   - Return array of medical records
   - Include: service_type, veterinarian, date, notes

4. GET /api/admin/pets/:petId/vaccinations
   - Permissions: MASTER, VET, DESK
   - Get vaccination records
   - Return:
     [
       {
         "date_administered": "2024-06-15",
         "vaccine_name": "Rabies",
         "administered_by": "Dr. Maria Santos",
         "next_due_date": "2025-06-15",
         "status": "Up to Date"  // or "Overdue", "Upcoming"
       },
       ...
     ]

5. GET /api/admin/pets/:petId/diagnoses
   - Permissions: MASTER, VET, DESK
   - Get AI diagnosis history for pet
   - Order by date_generated DESC
   - Return: array of SOAP reports (summary version)

6. GET /api/admin/pets/:petId/chat-history
   - Permissions: MASTER, VET, DESK
   - Get list of chatbot conversations
   - Return:
     [
       {
         "chat_id": "uuid",
         "title": "Symptom Checker - June 4, 2025",
         "date": "2025-06-04T14:30:00Z",
         "preview": "My cat has been sneezing...",
         "has_diagnosis": true
       },
       ...
     ]

7. GET /api/admin/pets/:petId/chat/:chatId
   - Permissions: MASTER, VET, DESK
   - Get complete chat conversation
   - Return:
     {
       "chat_id": "uuid",
       "pet_id": "RP-06-001",
       "owner_name": "Mal Beausoleil",
       "date": "2025-06-04T14:30:00Z",
       "messages": [
         {
           "sender": "user",  // or "bot"
           "message": "My cat has been sneezing",
           "timestamp": "2025-06-04T14:30:15Z"
         },
         ...
       ],
       "diagnosis_case_id": "#PDX-2025-0604-001"  // if generated
     }

8. GET /api/admin/pets/:petId/files
   - Permissions: MASTER, VET, DESK
   - Get list of downloadable medical files
   - Return:
     [
       {
         "file_id": "uuid",
         "file_name": "Blood_Test_Results_2025-06-04.pdf",
         "file_type": "pdf",
         "file_size": "2.4 MB",
         "uploaded_date": "2025-06-04",
         "url": "download_url"
       },
       ...
     ]

9. GET /api/admin/pets/:petId/files/:fileId/download
   - Permissions: MASTER, VET, DESK
   - Stream file for download
   - Set appropriate headers for file download
   - Return: file stream

10. GET /api/admin/pets/:petId/files/download-all
    - Permissions: MASTER, VET, DESK
    - Create temporary ZIP file with all medical files
    - Return: ZIP file stream
    - Clean up temp file after download

ZIP Generation (utility function):
import zipfile
import os
from django.http import HttpResponse

def create_medical_files_zip(pet_id):
    files = MedicalFile.objects.filter(pet_id=pet_id)
    zip_filename = f'medical_records_{pet_id}.zip'
    
    response = HttpResponse(content_type='application/zip')
    response['Content-Disposition'] = f'attachment; filename={zip_filename}'
    
    with zipfile.ZipFile(response, 'w') as zip_file:
        for file_obj in files:
            zip_file.write(file_obj.file.path, file_obj.file_name)
    
    return response

Files to modify:
- admin_panel/views.py (pet views)
- admin_panel/serializers.py (pet serializers)
- admin_panel/urls.py (register pet routes)
- admin_panel/utils.py (ZIP generation)
```

---

## **CHUNK 8: Admin Roles Endpoints (Master Admin Only)** 🔴 HIGH PRIORITY
```
Build admin account management (Master Admin exclusive):

Endpoints to create:
1. GET /api/admin/roles?search=&role=&status=&page=1&limit=10
   - Permissions: MASTER ONLY
   - Query params:
     - search: name, email
     - role: all, master, vet, desk
     - status: all, active, inactive
     - page, limit: pagination
   - Return:
     {
       "results": [
         {
           "admin_id": "uuid",
           "name": "Dr. Hazel Liwanag",
           "email": "hazel.liwanag@pawpal.com",
           "role": "Veterinarian",
           "status": "Active",
           "profile_image": "url",
           "date_created": "2025-01-01T10:00:00Z"
         },
         ...
       ],
       "pagination": {...}
     }

2. POST /api/admin/roles
   - Permissions: MASTER ONLY
   - Input: name, email, role (VET or DESK only, NOT MASTER)
   - Auto-generate strong password (12 chars, mixed)
   - Hash password
   - Create admin account
   - Send welcome email with temp password
   - Return: admin object + generated_password

3. GET /api/admin/roles/:adminId
   - Permissions: MASTER ONLY
   - Get specific admin details
   - Return: admin object

4. PUT /api/admin/roles/:adminId
   - Permissions: MASTER ONLY
   - Input: name, email, role, status (active/inactive)
   - Cannot change MASTER role
   - Validate email uniqueness
   - If email changed: send notification to both old and new emails
   - If status changed to inactive: admin cannot login
   - Return: updated admin object

5. DELETE /api/admin/roles/:adminId
   - Permissions: MASTER ONLY
   - Soft delete (set is_deleted=True, keep for audit)
   - Cannot delete last MASTER admin
   - Log deletion event
   - Return: success message

6. PUT /api/admin/roles/:adminId/status
   - Permissions: MASTER ONLY
   - Toggle active/inactive status
   - Return: updated status

Password Generation:
import secrets
import string

def generate_admin_password():
    chars = string.ascii_letters + string.digits + string.punctuation
    password = ''.join(secrets.choice(chars) for _ in range(12))
    return password

Audit Logging (create model):
class AdminAuditLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Created'),
        ('UPDATE', 'Updated'),
        ('DELETE', 'Deleted'),
        ('STATUS_CHANGE', 'Status Changed'),
    ]
    admin = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    target_admin_id = models.CharField(max_length=100)
    details = models.JSONField()
    timestamp = models.DateTimeField(auto_now_add=True)

Permission Decorator (strict):
@require_admin_role(['MASTER'])

Email Templates:
# Welcome email for new admin
Subject: Your PawPal Admin Account
Body: [Name], A Master Admin created an admin account for you...
      Email: {email}
      Temp Password: {password}
      Please login and change immediately: {admin_login_url}

Files to modify:
- admin_panel/models.py (AdminAuditLog)
- admin_panel/views.py (admin role views)
- admin_panel/serializers.py (admin serializers)
- admin_panel/urls.py (register role routes)
- admin_panel/utils.py (password generation)
- admin_panel/email_templates.py (welcome email)
```

---

## **CHUNK 9: Announcements Endpoints** 🟢 LOW PRIORITY
```
Build announcement management endpoints:

Endpoints to create:
1. GET /api/admin/announcements
   - Permissions: MASTER, VET, DESK
   - Get all announcements (active + expired)
   - Mark expired ones with "Expired" badge
   - Return:
     [
       {
         "announcement_id": "uuid",
         "title": "Summer Vaccination Special",
         "description": "Get 20% off all vaccinations...",
         "valid_until": "2025-07-30",  // or null for "Ongoing"
         "icon_type": "vaccination",
         "is_active": true,
         "is_expired": false,
         "created_at": "2025-06-01T10:00:00Z"
       },
       ...
     ]

2. POST /api/admin/announcements
   - Permissions: MASTER, VET, DESK
   - Input: title, description, valid_until, icon_type
   - Validate:
     - title: max 100 chars
     - description: max 500 chars
     - valid_until: must be future date (if not "Ongoing")
   - Create announcement
   - Return: created announcement object

3. PUT /api/admin/announcements/:id
   - Permissions: MASTER, VET, DESK
   - Input: title, description, valid_until, icon_type
   - Update announcement
   - Return: updated announcement object

4. DELETE /api/admin/announcements/:id
   - Permissions: MASTER, VET, DESK
   - Delete announcement (hard delete)
   - Return: success message

5. GET /api/announcements/active
   - PUBLIC endpoint (no auth required)
   - Get only active, non-expired announcements
   - Filter: is_active=True AND (valid_until IS NULL OR valid_until >= today)
   - Return: array of active announcements

Announcement Model (create if doesn't exist):
class Announcement(models.Model):
    ICON_CHOICES = [
        ('vaccination', 'Vaccination'),
        ('wellness', 'Wellness'),
        ('welcome', 'Welcome'),
        ('general', 'General'),
    ]
    title = models.CharField(max_length=100)
    description = models.TextField(max_length=500)
    valid_until = models.DateField(null=True, blank=True)  # null = ongoing
    icon_type = models.CharField(max_length=20, choices=ICON_CHOICES)
    is_active = models.BooleanField(default=True)
    created_by = models.ForeignKey(Admin, on_delete=models.SET_NULL, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    @property
    def is_expired(self):
        from datetime import date
        if self.valid_until is None:
            return False
        return self.valid_until < date.today()

Files to modify:
- admin_panel/models.py (Announcement model)
- admin_panel/views.py (announcement views)
- admin_panel/serializers.py (announcement serializers)
- admin_panel/urls.py (register announcement routes)
- Create public announcements endpoint in separate app or public view

CHUNK 10: Admin Profile Endpoints 🟢 LOW PRIORITY
Build admin profile management endpoints:

Endpoints to create:
1. GET /api/admin/profile
   - Permissions: MASTER, VET, DESK (own profile only)
   - Get current admin's profile data
   - Return:
     {
       "admin_id": "uuid",
       "name": "Dr. Hazel Liwanag",
       "email": "hazel.liwanag@pawpal.com",
       "role": "Veterinarian",
       "profile_image": "url",
       "clinic_info": "PawPal Veterinary Clinic",
       "contact_number": "09** *** **98",  // masked
       "recovery_email": "hazel.personal@gmail.com",
          "password_updated_at": "2025-01-15T10:30:00Z",
       "created_at": "2025-01-01T10:00:00Z"
     }

2. PUT /api/admin/profile
   - Permissions: MASTER, VET, DESK (own profile only)
   - Input: name, clinic_info, contact_number
   - Cannot change: email, role
   - Validate contact number format
   - Return: updated profile object

3. PUT /api/admin/profile/photo
   - Permissions: MASTER, VET, DESK (own profile only)
   - Input: image file (multipart/form-data)
   - Validate: JPG/PNG, max 2MB
   - Resize to 200x200px
   - Upload to storage (local or cloud)
   - Update profile_image URL
   - Return: new image URL

4. POST /api/admin/change-password
   - Permissions: MASTER, VET, DESK (own profile only)
   - Input: current_password, new_password, confirm_password
   - Validate:
     - current_password matches
     - new_password meets requirements (8+ chars, upper, lower, number, special)
     - new_password != confirm_password check
     - new_password not in last 3 passwords
   - Hash new password
   - Save to AdminPasswordHistory
   - Invalidate all admin sessions (force re-login)
   - Return: success message

5. POST /api/admin/recovery-email
   - Permissions: MASTER, VET, DESK (own profile only)
   - Input: recovery_email, confirm_recovery_email
   - Validate:
     - recovery_email != primary email
     - valid email format
     - emails match
   - Send verification email to recovery_email
   - Set recovery_email_verified = False until verified
   - Return: success message "Verification email sent"

6. POST /api/admin/recovery-email/verify
   - PUBLIC endpoint (accessed from email link)
   - Input: verification_token
   - Validate token
   - Set recovery_email_verified = True
   - Return: success page/redirect

7. POST /api/admin/logout
   - Permissions: MASTER, VET, DESK
   - Invalidate JWT token
   - Clear session
   - Log logout event
   - Return: success message

Password History Management:
def check_password_history(admin, new_password):
    # Get last 3 passwords
    history = AdminPasswordHistory.objects.filter(
        admin=admin
    ).order_by('-created_at')[:3]
    
    for record in history:
        if check_password(new_password, record.password_hash):
            return False  # Password was used before
    return True  # Password is new

def save_password_to_history(admin, password_hash):
    AdminPasswordHistory.objects.create(
        admin=admin,
        password_hash=password_hash
    )
    # Keep only last 3
    old_passwords = AdminPasswordHistory.objects.filter(
        admin=admin
    ).order_by('-created_at')[3:]
    for old in old_passwords:
        old.delete()

Image Upload Handler:
from PIL import Image
from django.core.files.uploadedfile import InMemoryUploadedFile
import io

def resize_profile_image(image_file):
    img = Image.open(image_file)
    img = img.resize((200, 200), Image.Resampling.LANCZOS)
    
    output = io.BytesIO()
    img.save(output, format='JPEG', quality=85)
    output.seek(0)
    
    return InMemoryUploadedFile(
        output, 'ImageField',
        f"{image_file.name.split('.')[0]}.jpg",
        'image/jpeg',
        output.getbuffer().nbytes,
        None
    )

Recovery Email Verification:
import secrets

def generate_verification_token(admin_id, recovery_email):
    token = secrets.token_urlsafe(32)
    # Store in cache or database with expiry (24 hours)
    cache.set(
        f'recovery_verify_{token}',
        {'admin_id': admin_id, 'email': recovery_email},
        timeout=86400  # 24 hours
    )
    return token

Email Templates:
# Recovery Email Verification
Subject: Verify Your Recovery Email
Body: Hi {name},
      Please verify your recovery email by clicking:
      {verification_link}
      This link expires in 24 hours.

Files to modify:
- admin_panel/models.py (add recovery_email_verified field to Admin)
- admin_panel/views.py (profile views)
- admin_panel/serializers.py (profile serializers)
- admin_panel/urls.py (register profile routes)
- admin_panel/utils.py (image resize, token generation)
- admin_panel/email_templates.py (recovery email template)
```

---

## **CHUNK 11: Permission & Middleware Setup** 🔴 HIGH PRIORITY
```
Build role-based permission system:

1. Create Permission Decorator:
# admin_panel/permissions.py

from functools import wraps
from rest_framework.response import Response
from rest_framework import status
import jwt
from django.conf import settings

def require_admin_role(allowed_roles):
    """
    Decorator to check if admin has required role
    Usage: @require_admin_role(['MASTER', 'VET'])
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapped_view(request, *args, **kwargs):
            try:
                # Extract JWT token from Authorization header
                auth_header = request.META.get('HTTP_AUTHORIZATION', '')
                if not auth_header.startswith('Bearer '):
                    return Response(
                        {"error": "Authentication required"},
                        status=status.HTTP_401_UNAUTHORIZED
                    )
                
                token = auth_header.split(' ')[1]
                payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
                
                admin_role = payload.get('role')
                admin_id = payload.get('admin_id')
                
                # Check if role is allowed
                if admin_role not in allowed_roles:
                    return Response(
                        {"error": "Permission denied"},
                        status=status.HTTP_403_FORBIDDEN
                    )
                
                # Attach admin info to request
                request.admin_id = admin_id
                request.admin_role = admin_role
                
                return view_func(request, *args, **kwargs)
                
            except jwt.ExpiredSignatureError:
                return Response(
                    {"error": "Token expired"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
            except jwt.InvalidTokenError:
                return Response(
                    {"error": "Invalid token"},
                    status=status.HTTP_401_UNAUTHORIZED
                )
        
        return wrapped_view
    return decorator

2. Create JWT Utility Functions:
# admin_panel/jwt_utils.py

import jwt
from datetime import datetime, timedelta
from django.conf import settings

def generate_admin_token(admin):
    """Generate JWT token for admin with role"""
    payload = {
        'admin_id': str(admin.id),
        'email': admin.email,
        'role': admin.role,
        'exp': datetime.utcnow() + timedelta(hours=8),  # 8-hour expiry
        'iat': datetime.utcnow()
    }
    token = jwt.encode(payload, settings.SECRET_KEY, algorithm='HS256')
    return token

def verify_admin_token(token):
    """Verify JWT token and return payload"""
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
        return payload, None
    except jwt.ExpiredSignatureError:
        return None, "Token expired"
    except jwt.InvalidTokenError:
        return None, "Invalid token"

3. Create Rate Limiting Middleware:
# middleware/rate_limit.py

from django.core.cache import cache
from django.http import JsonResponse
from datetime import datetime

class RateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response
    
    def __call__(self, request):
        # Rate limit OTP endpoints
        if request.path in ['/api/auth/send-otp/', '/api/auth/request-password-reset/']:
            email = request.POST.get('email') or request.data.get('email')
            if email:
                cache_key = f'otp_rate_limit_{email}'
                attempts = cache.get(cache_key, [])
                
                # Filter attempts within last hour
                now = datetime.now().timestamp()
                recent_attempts = [t for t in attempts if now - t < 3600]
                
                if len(recent_attempts) >= 3:
                    return JsonResponse(
                        {
                            "error": "Too many OTP requests. Please try again in 1 hour.",
                            "code": "RATE_LIMIT_EXCEEDED"
                        },
                        status=429
                    )
                
                # Add current attempt
                recent_attempts.append(now)
                cache.set(cache_key, recent_attempts, timeout=3600)
        
        response = self.get_response(request)
        return response

4. Create Audit Logging Utility:
# admin_panel/audit.py

from admin_panel.models import AdminAuditLog

def log_admin_action(admin_id, action, target_admin_id=None, details=None):
    """Log admin actions for audit trail"""
    AdminAuditLog.objects.create(
        admin_id=admin_id,
        action=action,
        target_admin_id=target_admin_id or admin_id,
        details=details or {}
    )

5. Apply Decorators to Views (Examples):
# admin_panel/views.py

from admin_panel.permissions import require_admin_role
from admin_panel.audit import log_admin_action

@require_admin_role(['MASTER', 'VET', 'DESK'])
def dashboard_stats(request):
    # All admin roles can access
    ...

@require_admin_role(['MASTER', 'VET'])
def update_client(request, user_id):
    # Only Master Admin and Vet can edit clients
    ...
    log_admin_action(
        request.admin_id,
        'UPDATE',
        target_admin_id=user_id,
        details={'changes': updated_fields}
    )
    ...

@require_admin_role(['MASTER'])
def create_admin(request):
    # Only Master Admin can create other admins
    ...
    log_admin_action(
        request.admin_id,
        'CREATE',
        target_admin_id=new_admin.id,
        details={'role': new_admin.role}
    )
    ...

6. Configure Settings:
# vet_app/settings.py

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
    'middleware.rate_limit.RateLimitMiddleware',  # Add rate limiting
]

# JWT Secret Key
SECRET_KEY = os.getenv('SECRET_KEY', 'your-secret-key-here')

# Cache for rate limiting
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.locmem.LocMemCache',
        'LOCATION': 'unique-snowflake',
    }
}

Files to create:
- admin_panel/permissions.py
- admin_panel/jwt_utils.py
- admin_panel/audit.py
- middleware/rate_limit.py
- middleware/__init__.py
```

---

## **CHUNK 12: Error Handling & Response Standardization** 🟡 MEDIUM PRIORITY
```
Standardize API responses and error handling:

1. Create Response Utility:
# utils/responses.py

from rest_framework.response import Response
from rest_framework import status

def success_response(data=None, message=None, status_code=status.HTTP_200_OK):
    """Standard success response"""
    response_data = {
        "success": True
    }
    if data is not None:
        response_data["data"] = data
    if message:
        response_data["message"] = message
    
    return Response(response_data, status=status_code)

def error_response(code, message, details=None, status_code=status.HTTP_400_BAD_REQUEST):
    """Standard error response"""
    response_data = {
        "success": False,
        "error": {
            "code": code,
            "message": message
        }
    }
    if details:
        response_data["error"]["details"] = details
    
    return Response(response_data, status=status_code)

def paginated_response(results, page, limit, total):
    """Standard paginated response"""
    return success_response({
        "results": results,
        "pagination": {
            "page": page,
            "limit": limit,
            "total": total,
            "totalPages": (total + limit - 1) // limit,
            "hasNext": page * limit < total,
            "hasPrev": page > 1
        }
    })

2. Define Error Codes:
# utils/error_codes.py

# Authentication Errors (401)
AUTH_INVALID_CREDENTIALS = "AUTH_INVALID_CREDENTIALS"
AUTH_TOKEN_EXPIRED = "AUTH_TOKEN_EXPIRED"
AUTH_TOKEN_INVALID = "AUTH_TOKEN_INVALID"
AUTH_UNAUTHORIZED = "AUTH_UNAUTHORIZED"

# Authorization Errors (403)
PERMISSION_DENIED = "PERMISSION_DENIED"
ROLE_REQUIRED = "ROLE_REQUIRED"
RESOURCE_FORBIDDEN = "RESOURCE_FORBIDDEN"

# Validation Errors (400)
VALIDATION_ERROR = "VALIDATION_ERROR"
MISSING_REQUIRED_FIELD = "MISSING_REQUIRED_FIELD"
INVALID_FORMAT = "INVALID_FORMAT"

# Resource Errors (404)
RESOURCE_NOT_FOUND = "RESOURCE_NOT_FOUND"

# Business Logic Errors (422)
OTP_EXPIRED = "OTP_EXPIRED"
OTP_INVALID = "OTP_INVALID"
OTP_MAX_ATTEMPTS = "OTP_MAX_ATTEMPTS"
EMAIL_ALREADY_EXISTS = "EMAIL_ALREADY_EXISTS"
CANNOT_DELETE_LAST_ADMIN = "CANNOT_DELETE_LAST_ADMIN"

# Server Errors (500)
INTERNAL_SERVER_ERROR = "INTERNAL_SERVER_ERROR"
EMAIL_SEND_FAILED = "EMAIL_SEND_FAILED"
FILE_UPLOAD_FAILED = "FILE_UPLOAD_FAILED"

3. Create Exception Handler:
# utils/exception_handler.py

from rest_framework.views import exception_handler as drf_exception_handler
from rest_framework.exceptions import ValidationError, NotFound, PermissionDenied
from utils.responses import error_response
from utils.error_codes import *
import logging

logger = logging.getLogger(__name__)

def custom_exception_handler(exc, context):
    """Custom exception handler for all API errors"""
    
    # Call DRF's default handler first
    response = drf_exception_handler(exc, context)
    
    # Handle validation errors
    if isinstance(exc, ValidationError):
        return error_response(
            code=VALIDATION_ERROR,
            message="Invalid input provided",
            details=exc.detail,
            status_code=400
        )
    
    # Handle not found errors
    if isinstance(exc, NotFound):
        return error_response(
            code=RESOURCE_NOT_FOUND,
            message=str(exc.detail),
            status_code=404
        )
    
    # Handle permission errors
    if isinstance(exc, PermissionDenied):
        return error_response(
            code=PERMISSION_DENIED,
            message=str(exc.detail),
            status_code=403
        )
    
    # Log unexpected errors
    if response is None:
        logger.error(f"Unhandled exception: {exc}", exc_info=True)
        return error_response(
            code=INTERNAL_SERVER_ERROR,
            message="An unexpected error occurred",
            status_code=500
        )
    
    return response

4. Apply to Settings:
# vet_app/settings.py

REST_FRAMEWORK = {
    'EXCEPTION_HANDLER': 'utils.exception_handler.custom_exception_handler',
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
    'DEFAULT_PARSER_CLASSES': [
        'rest_framework.parsers.JSONParser',
        'rest_framework.parsers.MultiPartParser',
    ],
}

5. Example Usage in Views:
# users/views_otp.py

from utils.responses import success_response, error_response
from utils.error_codes import *

def verify_otp(request):
    try:
        email = request.data.get('email')
        otp_code = request.data.get('otp_code')
        
        # Validate OTP
        otp = OTP.objects.filter(email=email, code=otp_code).first()
        
        if not otp:
            return error_response(
                code=OTP_INVALID,
                message="Invalid OTP code",
                status_code=400
            )
        
        if otp.is_expired():
            return error_response(
                code=OTP_EXPIRED,
                message="This code has expired. Please request a new code.",
                status_code=400
            )
        
        if otp.attempts >= 3:
            return error_response(
                code=OTP_MAX_ATTEMPTS,
                message="Too many failed attempts. Please wait 5 minutes and request a new code.",
                status_code=429
            )
        
        # Verify successful
        otp.is_verified = True
        otp.save()
        
        return success_response(
            message="Email verified successfully"
        )
        
    except Exception as e:
        logger.error(f"Error verifying OTP: {e}")
        return error_response(
            code=INTERNAL_SERVER_ERROR,
            message="An error occurred while verifying OTP",
            status_code=500
        )

Files to create:
- utils/responses.py
- utils/error_codes.py
- utils/exception_handler.py
- utils/__init__.py
```

---

## **CHUNK 13: Database Migrations & Sample Data** 🟡 MEDIUM PRIORITY
```
Set up database and create sample data:

1. Create Missing Models:
Make sure these models exist:
- Admin (admin_panel/models.py)
- AdminPasswordHistory (admin_panel/models.py)
- AdminAuditLog (admin_panel/models.py)
- Announcement (admin_panel/models.py)
- OTP (users/models.py) - already exists
- SOAPReport (chatbot/models.py) - already exists

2. Create Migrations:
python manage.py makemigrations users
python manage.py makemigrations chatbot
python manage.py makemigrations admin_panel
python manage.py migrate

3. Create Seed Data Script:
# management/commands/seed_data.py

from django.core.management.base import BaseCommand
from django.contrib.auth.hashers import make_password
from admin_panel.models import Admin, Announcement
from users.models import User
from pets.models import Pet
from datetime import date, timedelta

class Command(BaseCommand):
    help = 'Seed database with sample data'
    
    def handle(self, *args, **kwargs):
        # Create Master Admin
        master_admin, created = Admin.objects.get_or_create(
            email='maria.santos@pawpal.com',
            defaults={
                'name': 'Dr. Maria Santos',
                'role': 'MASTER',
                'password': make_password('MasterAdmin123!'),
                'is_active': True,
                'contact_number': '09171234567',
                'clinic_info': 'PawPal Veterinary Clinic'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created Master Admin'))
        
        # Create Veterinarian
        vet_admin, created = Admin.objects.get_or_create(
            email='hazel.liwanag@pawpal.com',
            defaults={
                'name': 'Dr. Hazel Liwanag',
                'role': 'VET',
                'password': make_password('VetAdmin123!'),
                'is_active': True,
                'contact_number': '09181234567',
                'clinic_info': 'PawPal Veterinary Clinic'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created Veterinarian Admin'))
        
        # Create Front Desk
        desk_admin, created = Admin.objects.get_or_create(
            email='john.delacruz@pawpal.com',
            defaults={
                'name': 'John Dela Cruz',
                'role': 'DESK',
                'password': make_password('DeskAdmin123!'),
                'is_active': True,
                'contact_number': '09191234567',
                'clinic_info': 'PawPal Veterinary Clinic'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created Front Desk Admin'))
        
        # Create Sample Pet Owners
        owner1, created = User.objects.get_or_create(
            email='mal.beausoleil@example.com',
            defaults={
                'name': 'Mal Beausoleil',
                'password': make_password('Owner123!'),
                'contact_number': '09453419798',
                'city_province': 'Santa Rosa City, Laguna',
                'address': '123 Sample Street, Santa Rosa',
                'is_verified': True,
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created pet owner: Mal Beausoleil'))
        
        owner2, created = User.objects.get_or_create(
            email='sarah.j@example.com',
            defaults={
                'name': 'Sarah Johnson',
                'password': make_password('Owner123!'),
                'contact_number': '09171234567',
                'city_province': 'Quezon City, Metro Manila',
                'address': '456 Test Avenue, QC',
                'is_verified': True,
                'is_active': True
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created pet owner: Sarah Johnson'))
        
        # Create Sample Pets
        pet1, created = Pet.objects.get_or_create(
            pet_id='RP-06-001',
            defaults={
                'name': 'Charlie',
                'owner': owner1,
                'species': 'Cat',
                'breed': 'Domestic Shorthair',
                'sex': 'Male',
                'age': '2 years old',
                'blood_type': 'Type A',
                'spayed_neutered': False,
                'allergies': 'Flea Allergy Dermatitis',
                'status': 'Active'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created pet: Charlie'))
        
        pet2, created = Pet.objects.get_or_create(
            pet_id='RP-06-002',
            defaults={
                'name': 'Max',
                'owner': owner2,
                'species': 'Dog',
                'breed': 'Golden Retriever',
                'sex': 'Male',
                'age': '4 years old',
                'blood_type': 'DEA 1.1 Positive',
                'spayed_neutered': True,
                'chronic_disease': 'Hip Dysplasia',
                'status': 'Active'
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created pet: Max'))
        
        # Create Sample Announcements
        ann1, created = Announcement.objects.get_or_create(
            title='Summer Vaccination Special',
            defaults={
                'description': 'Get 20% off all vaccinations during June and July. Keep your pets protected for less!',
                'valid_until': date.today() + timedelta(days=60),
                'icon_type': 'vaccination',
                'is_active': True,
                'created_by': master_admin
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created announcement: Summer Vaccination Special'))
        
        ann2, created = Announcement.objects.get_or_create(
            title='New Client Welcome Package',
            defaults={
                'description': 'First-time clients receive 15% off their initial consultation and a free pet care kit.',
                'valid_until': None,  # Ongoing
                'icon_type': 'welcome',
                'is_active': True,
                'created_by': master_admin
            }
        )
        if created:
            self.stdout.write(self.style.SUCCESS('Created announcement: New Client Welcome Package'))
        
        self.stdout.write(self.style.SUCCESS('\n✅ Database seeded successfully!'))
        self.stdout.write(self.style.SUCCESS('\nAdmin Accounts:'))
        self.stdout.write(f'  Master Admin: maria.santos@pawpal.com / MasterAdmin123!')
        self.stdout.write(f'  Veterinarian: hazel.liwanag@pawpal.com / VetAdmin123!')
        self.stdout.write(f'  Front Desk: john.delacruz@pawpal.com / DeskAdmin123!')
        self.stdout.write(self.style.SUCCESS('\nPet Owner Accounts:'))
        self.stdout.write(f'  Mal Beausoleil: mal.beausoleil@example.com / Owner123!')
        self.stdout.write(f'  Sarah Johnson: sarah.j@example.com / Owner123!')

4. Run Seed Command:
python manage.py seed_data

Files to create:
- admin_panel/management/__init__.py
- admin_panel/management/commands/__init__.py
- admin_panel/management/commands/seed_data.py