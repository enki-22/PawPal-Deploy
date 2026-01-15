from django.apps import AppConfig
import logging

logger = logging.getLogger(__name__)


class ChatbotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chatbot'
    
    def ready(self):
        """
        Override ready() to pre-load heavy NLP models during server startup.
        This eliminates the 5-10 second delay on the first user request.
        """
        # Only run once (avoid duplicate loading in multi-threaded environments)
        if not hasattr(self, '_models_loaded'):
            self._models_loaded = True
            
            try:
                logger.info("="*60)
                logger.info("🚀 PRE-LOADING VECTOR SIMILARITY ENGINE AT STARTUP...")
                logger.info("="*60)
                
                # Import here to avoid circular imports
                from vector_similarity_django_integration import get_triage_engine
                
                # Load the engine (singleton pattern ensures it loads only once)
                engine = get_triage_engine()
                
                logger.info("="*60)
                logger.info("✅ VECTOR ENGINE PRE-LOADED SUCCESSFULLY")
                logger.info("   First user request will now be INSTANT!")
                logger.info("="*60)
                
            except Exception as e:
                logger.error("="*60)
                logger.error(f"❌ FAILED TO PRE-LOAD VECTOR ENGINE: {e}")
                logger.error("   Engine will load lazily on first request instead")
                logger.error("="*60)
