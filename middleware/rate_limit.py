"""
Rate limiting middleware for OTP and password reset endpoints
Prevents abuse by limiting request frequency
"""
from django.core.cache import cache
from django.http import JsonResponse
from datetime import datetime
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class RateLimitMiddleware:
    """
    Middleware to rate limit OTP and password reset endpoints
    
    Rate limits:
        - 3 requests per hour per email for OTP endpoints
        - 3 requests per hour per email for password reset endpoints
    
    Attributes:
        rate_limit_paths: List of paths to apply rate limiting to
        max_requests: Maximum requests allowed per time window
        time_window_seconds: Time window in seconds (default: 3600 = 1 hour)
    """
    
    rate_limit_paths = [
        '/api/auth/send-otp/',
        '/api/auth/request-password-reset/',
        '/api/admin/request-password-reset',
    ]
    
    max_requests = 3
    time_window_seconds = 3600  # 1 hour
    
    def __init__(self, get_response):
        """
        Initialize middleware
        
        Args:
            get_response: Django's get_response callable
        """
        self.get_response = get_response
    
    def __call__(self, request):
        """
        Process request and apply rate limiting
        
        Args:
            request: HTTP request object
        
        Returns:
            JsonResponse if rate limit exceeded, otherwise continues to next middleware
        """
        # Check if this path should be rate limited
        if request.path in self.rate_limit_paths:
            email = self._extract_email(request)
            
            if email:
                if self._is_rate_limited(email):
                    logger.warning(
                        f"Rate limit exceeded for {request.path} from email: {email}"
                    )
                    return JsonResponse(
                        {
                            "success": False,
                            "error": f"Too many requests. Please try again in 1 hour.",
                            "code": "RATE_LIMIT_EXCEEDED",
                            "retry_after": self.time_window_seconds
                        },
                        status=429  # Too Many Requests
                    )
                
                # Record this attempt
                self._record_attempt(email)
        
        # Continue to next middleware/view
        response = self.get_response(request)
        return response
    
    def _extract_email(self, request) -> Optional[str]:
        """
        Extract email from request (POST data, JSON body, or query params)
        
        Args:
            request: HTTP request object
        
        Returns:
            Email string or None if not found
        """
        email = None
        
        # Try POST data
        if request.method == 'POST':
            if hasattr(request, 'data'):
                # DRF request with parsed JSON
                email = request.data.get('email')
            elif request.POST:
                # Standard Django POST
                email = request.POST.get('email')
        
        # Try query parameters
        if not email and request.GET:
            email = request.GET.get('email')
        
        # Normalize email (lowercase, strip)
        if email:
            email = email.lower().strip()
        
        return email
    
    def _is_rate_limited(self, email: str) -> bool:
        """
        Check if email has exceeded rate limit
        
        Args:
            email: Email address to check
        
        Returns:
            True if rate limited, False otherwise
        """
        cache_key = f'rate_limit_otp_{email}'
        attempts = cache.get(cache_key, [])
        
        if not attempts:
            return False
        
        # Filter attempts within time window
        now = datetime.now().timestamp()
        time_threshold = now - self.time_window_seconds
        
        recent_attempts = [
            timestamp for timestamp in attempts
            if timestamp >= time_threshold
        ]
        
        # Check if limit exceeded
        return len(recent_attempts) >= self.max_requests
    
    def _record_attempt(self, email: str):
        """
        Record an attempt for rate limiting
        
        Args:
            email: Email address to record attempt for
        """
        cache_key = f'rate_limit_otp_{email}'
        attempts = cache.get(cache_key, [])
        
        # Add current attempt timestamp
        now = datetime.now().timestamp()
        attempts.append(now)
        
        # Filter out old attempts (outside time window)
        time_threshold = now - self.time_window_seconds
        attempts = [
            timestamp for timestamp in attempts
            if timestamp >= time_threshold
        ]
        
        # Store in cache (expire after time window)
        cache.set(cache_key, attempts, timeout=self.time_window_seconds + 60)
        
        logger.debug(
            f"Rate limit attempt recorded for {email} "
            f"({len(attempts)}/{self.max_requests} in last hour)"
        )

