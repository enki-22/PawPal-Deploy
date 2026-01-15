from django.apps import AppConfig
import logging
import os

logger = logging.getLogger(__name__)


class ChatbotConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'chatbot'
    
    # Global variables to hold ML models
    pawpal_model = None
    pawpal_preprocessor = None
    pawpal_label_encoder = None
    pawpal_disease_metadata = None
    
    def ready(self):
        """
        Override ready() to pre-load heavy NLP and ML models during server startup.
        This eliminates the 5-10 second delay on the first user request.
        """
        # Only run once in production/development (avoid duplicate loading during migrations)
        if os.environ.get('RUN_MAIN') or os.environ.get('WERKZEUG_RUN_MAIN'):
            # Prevent duplicate loading
            if not hasattr(self, '_models_loaded'):
                self._models_loaded = True
                
                # Load Vector Similarity Engine
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
                
                # Load PawPal LightGBM Model
                try:
                    logger.info("="*60)
                    logger.info("🚀 PRE-LOADING PAWPAL LIGHTGBM MODEL AT STARTUP...")
                    logger.info("="*60)
                    
                    from django.conf import settings
                    import joblib
                    import json
                    
                    base_dir = settings.BASE_DIR
                    model_path = os.path.join(str(base_dir), "pawpal_model.pkl")
                    label_path = os.path.join(str(base_dir), "pawpal_label_encoder.pkl")
                    metadata_path = os.path.join(str(base_dir), "pawpal_disease_metadata.json")
                    
                    if os.path.exists(model_path):
                        # Load model artifacts
                        try:
                            artifacts = joblib.load(model_path)
                        except Exception:
                            import pickle
                            with open(model_path, "rb") as f:
                                artifacts = pickle.load(f)
                        
                        self.pawpal_model = artifacts.get("model")
                        self.pawpal_preprocessor = artifacts.get("preprocessor")
                        
                        # Load label encoder
                        try:
                            self.pawpal_label_encoder = joblib.load(label_path)
                        except Exception:
                            import pickle
                            with open(label_path, "rb") as f:
                                self.pawpal_label_encoder = pickle.load(f)
                        
                        # Load metadata
                        if os.path.exists(metadata_path):
                            with open(metadata_path, "r") as f:
                                self.pawpal_disease_metadata = json.load(f)
                        else:
                            self.pawpal_disease_metadata = {}
                        
                        logger.info("="*60)
                        logger.info("✅ PAWPAL LIGHTGBM MODEL PRE-LOADED SUCCESSFULLY")
                        logger.info(f"   Model: {type(self.pawpal_model).__name__}")
                        logger.info(f"   Diseases: {len(self.pawpal_disease_metadata)} loaded")
                        logger.info("="*60)
                    else:
                        logger.warning(f"⚠️ Model not found at {model_path}")
                        
                except Exception as e:
                    logger.error("="*60)
                    logger.error(f"❌ FAILED TO PRE-LOAD PAWPAL MODEL: {e}")
                    logger.error("   Model will load lazily on first request instead")
                    logger.error("="*60)

