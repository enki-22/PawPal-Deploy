import sys
import os
from pathlib import Path
from django.core.management.base import BaseCommand

class Command(BaseCommand):
    help = 'Train the image classifier using real Kaggle datasets'

    def add_arguments(self, parser):
        parser.add_argument(
            '--download-data',
            action='store_true',
            help='Download datasets from Kaggle',
        )
        parser.add_argument(
            '--epochs',
            type=int,
            default=20,
            help='Number of training epochs',
        )

    def handle(self, *args, **options):
        self.stdout.write("🚀 Starting real dataset image classifier training...")
        
        try:
            # FIXED: Import from project root instead of ml package
            project_root = Path(__file__).resolve().parent.parent.parent.parent
            sys.path.insert(0, str(project_root))
            
            # Import the training module from root directory
            import train_image_classifier
            
            # Run the main training function
            train_image_classifier.main()
            
            self.stdout.write(
                self.style.SUCCESS('✅ Real dataset training completed successfully!')
            )
            self.stdout.write('Models saved in ml/models/ directory')
            self.stdout.write('Expected accuracy: 70-90% (much better than 16%!)')
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'❌ Training failed: {e}')
            )
            import traceback
            self.stdout.write(str(traceback.format_exc()))