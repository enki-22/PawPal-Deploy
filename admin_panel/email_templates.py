"""
Email templates for admin client management
"""


def get_verification_email_template(user_name, admin_name):
    """
    Get verification confirmation email template
    
    Args:
        user_name: Client's name
        admin_name: Admin who verified the account
    
    Returns:
        tuple: (subject, message)
    """
    subject = "Your PawPal Account Has Been Verified!"
    
    message = f"""
Dear {user_name},

Great news! Your PawPal account has been verified by our team.

You now have full access to all PawPal features:
- AI-powered pet symptom analysis
- Comprehensive SOAP reports
- Chat consultation with AI
- Pet health tracking
- And much more!

Your account was verified by: {admin_name}

You can now log in and start using all features at: https://pawpal.com

If you have any questions or need assistance, please don't hesitate to contact our support team.

Thank you for choosing PawPal for your pet's health needs!

Best regards,
The PawPal Team

---
This is an automated message. Please do not reply to this email.
For support, contact: support@pawpal.com
"""
    
    return subject, message


def get_deactivation_email_template(user_name, reason=None):
    """
    Get account deactivation email template
    
    Args:
        user_name: Client's name
        reason: Optional reason for deactivation
    
    Returns:
        tuple: (subject, message)
    """
    subject = "Your PawPal Account Has Been Deactivated"
    
    reason_text = f"\n\nReason: {reason}" if reason else ""
    
    message = f"""
Dear {user_name},

We are writing to inform you that your PawPal account has been deactivated.

{reason_text}

What this means:
- You will not be able to log in to your account
- Your data remains secure and will not be deleted
- You can request account reactivation by contacting support

If you believe this was done in error or would like to discuss reactivation, please contact our support team at support@pawpal.com.

We understand this may be inconvenient and apologize for any disruption to your service.

Best regards,
The PawPal Team

---
For support or to request reactivation: support@pawpal.com
"""
    
    return subject, message


def get_welcome_email_template(user_name):
    """
    Get welcome email template for new users
    
    Args:
        user_name: Client's name
    
    Returns:
        tuple: (subject, message)
    """
    subject = "Welcome to PawPal - Your Pet's Health Companion!"
    
    message = f"""
Dear {user_name},

Welcome to PawPal! We're thrilled to have you join our community of caring pet owners.

Here's what you can do with PawPal:

🐾 AI-Powered Diagnosis
   Get instant symptom analysis for your pets using advanced AI technology

📋 SOAP Reports
   Receive comprehensive health reports following veterinary standards

💬 Chat Consultation
   Get guidance through our AI chat assistant

📊 Health Tracking
   Keep track of your pet's health history and diagnoses

📷 Image Analysis
   Upload photos of visible symptoms for better diagnosis

Getting Started:
1. Complete your profile
2. Add your pet(s) information
3. Start using our AI diagnostic tools

Need help? Visit our FAQ section or contact support@pawpal.com

Thank you for trusting PawPal with your pet's health!

Best regards,
The PawPal Team

---
PawPal - Because Every Pet Deserves Quality Care
"""
    
    return subject, message


def get_custom_email_template(subject, message, recipient_name):
    """
    Format custom email with professional header/footer
    
    Args:
        subject: Email subject
        message: Email message body
        recipient_name: Recipient's name
    
    Returns:
        tuple: (subject, formatted_message)
    """
    formatted_message = f"""
Dear {recipient_name},

{message}

Best regards,
The PawPal Team

---
This message was sent from PawPal Admin Panel
For support: support@pawpal.com
"""
    
    return subject, formatted_message


def get_update_notification_template(user_name, updated_fields):
    """
    Get account update notification template
    
    Args:
        user_name: Client's name
        updated_fields: List of fields that were updated
    
    Returns:
        tuple: (subject, message)
    """
    subject = "Your PawPal Account Information Has Been Updated"
    
    fields_text = ", ".join(updated_fields)
    
    message = f"""
Dear {user_name},

This is to inform you that your PawPal account information has been updated by an administrator.

Updated information: {fields_text}

If you did not request this change or believe this was done in error, please contact our support team immediately at support@pawpal.com.

For security reasons, we recommend reviewing your account information to ensure all details are correct.

You can log in to your account at: https://pawpal.com

Thank you for your attention to this matter.

Best regards,
The PawPal Team

---
If you have concerns about this change: support@pawpal.com
"""
    
    return subject, message


def get_admin_welcome_email_template(admin_name, email, temp_password, admin_login_url='https://admin.pawpal.com/login'):
    """
    Get welcome email template for new admin accounts
    
    Args:
        admin_name: New admin's name
        email: New admin's email
        temp_password: Temporary password generated
        admin_login_url: Admin panel login URL
    
    Returns:
        tuple: (subject, message)
    """
    subject = "Your PawPal Admin Account"
    
    message = f"""
Dear {admin_name},

A Master Admin has created an admin account for you on the PawPal Admin Panel.

Your Account Details:
-------------------
Email: {email}
Temporary Password: {temp_password}

IMPORTANT SECURITY NOTICE:
- This is a temporary password
- You MUST change your password immediately after first login
- Do not share this password with anyone
- If you did not request this account, please contact support immediately

Getting Started:
1. Visit the admin panel: {admin_login_url}
2. Log in using your email and temporary password above
3. You will be prompted to change your password on first login
4. Complete your profile setup

Admin Panel Features:
- Manage clients and pets
- View and analyze SOAP reports
- Access comprehensive diagnostics
- Monitor system statistics
- Manage announcements and FAQs

Support:
If you have any questions or need assistance, please contact:
- Email: admin-support@pawpal.com
- Phone: Available in your onboarding materials

Welcome to the PawPal team!

Best regards,
The PawPal Admin Team

---
This is an automated message. Please do not reply to this email.
For support: admin-support@pawpal.com
"""
    
    return subject, message


def get_admin_update_notification_template(admin_name, changed_fields, old_email=None, new_email=None):
    """
    Get admin account update notification email template
    
    Args:
        admin_name: Admin's name
        changed_fields: List of fields that were updated
        old_email: Old email (if email was changed)
        new_email: New email (if email was changed)
    
    Returns:
        tuple: (subject, message)
    """
    subject = "Your PawPal Admin Account Has Been Updated"
    
    fields_text = ", ".join(changed_fields)
    email_change_note = ""
    
    if old_email and new_email:
        email_change_note = f"\n\nIMPORTANT: Your email address has been changed from {old_email} to {new_email}.\nPlease use your new email address to log in."
    
    message = f"""
Dear {admin_name},

This is to inform you that your PawPal Admin account has been updated by a Master Admin.

Updated Information:
{fields_text}
{email_change_note}

If you did not request these changes or believe this was done in error, please contact admin-support@pawpal.com immediately.

For security reasons, we recommend:
- Reviewing your account settings
- Verifying all information is correct
- Changing your password if you have concerns

Best regards,
The PawPal Admin Team

---
If you have concerns: admin-support@pawpal.com
"""
    
    return subject, message


def get_recovery_email_verification_template(admin_name, verification_link):
    """
    Get recovery email verification email template
    
    Args:
        admin_name: Admin's name
        verification_link: Link to verify recovery email
    
    Returns:
        tuple: (subject, message)
    """
    subject = "Verify Your Recovery Email"
    
    message = f"""
Hi {admin_name},

Please verify your recovery email address by clicking the link below:

{verification_link}

This link will expire in 24 hours.

If you did not request this verification, please ignore this email or contact admin-support@pawpal.com immediately.

Security Note:
- This link can only be used once
- Never share this verification link with anyone
- If you believe this is an error, contact support immediately

Best regards,
The PawPal Admin Team

---
This is an automated message. Please do not reply to this email.
For support: admin-support@pawpal.com
"""
    
    return subject, message

