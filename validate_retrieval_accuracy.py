import csv
import logging
from tqdm import tqdm  # You might need to pip install tqdm, or remove this if not needed
from smart_triage_engine import SmartTriageEngine

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger("AccuracyTest")

def calculate_retrieval_accuracy(csv_path='knowledge_base_enhanced.csv'):
    print("\n" + "="*60)
    print("🔬 RUNNING RETRIEVAL ACCURACY VALIDATION")
    print("="*60)
    print("Loading Knowledge Base & Vector Engine...")
    
    # Initialize your engine
    try:
        engine = SmartTriageEngine(csv_path)
    except Exception as e:
        print(f"❌ Failed to load engine: {e}")
        return

    # Metrics
    total_cases = 0
    correct_top_1 = 0  # Strict Accuracy
    correct_top_3 = 0  # Retrieval Recall @ 3
    correct_top_5 = 0  # Retrieval Recall @ 5
    
    failures = []

    # Load the ground truth data
    with open(csv_path, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        dataset = list(reader)
        
    print(f"📋 Validating against {len(dataset)} verified disease profiles...\n")

    # Iterate through every disease in your database
    for row in dataset:
        target_disease = row['disease'].strip()
        species = row['species'].strip()
        
        # Parse symptoms (ground truth inputs)
        symptoms_str = row['symptoms']
        symptoms_list = [s.strip() for s in symptoms_str.split(',') if s.strip()]
        
        if not symptoms_list:
            continue

        total_cases += 1
        
        # === THE TEST ===
        # We query the engine with the disease's OWN symptoms
        result = engine.diagnose(species, symptoms_list, top_n=5)
        predictions = result['top_matches']
        
        # Check rankings
        found_at_index = -1
        for i, pred in enumerate(predictions):
            # Case-insensitive comparison
            if pred['disease'].lower() == target_disease.lower():
                found_at_index = i
                break
        
        # Update Metrics
        if found_at_index == 0:
            correct_top_1 += 1
        else:
            # Record failure for analysis
            failures.append({
                'disease': target_disease,
                'rank': found_at_index + 1 if found_at_index != -1 else 'Not Found',
                'top_prediction': predictions[0]['disease'] if predictions else 'None'
            })

        if found_at_index != -1 and found_at_index < 3:
            correct_top_3 += 1
            
        if found_at_index != -1 and found_at_index < 5:
            correct_top_5 += 1

    # === CALCULATE SCORES ===
    accuracy_top1 = (correct_top_1 / total_cases) * 100
    recall_top3 = (correct_top_3 / total_cases) * 100
    recall_top5 = (correct_top_5 / total_cases) * 100

    # === REPORT GENERATION ===
    print("\n" + "="*60)
    print("📊 FINAL VALIDATION REPORT")
    print("="*60)
    print(f"Total Test Cases:      {total_cases}")
    print(f"Top-1 Accuracy:        {accuracy_top1:.2f}%  (Target: >95%)")
    print(f"Top-3 Recall:          {recall_top3:.2f}%")
    print(f"Top-5 Recall:          {recall_top5:.2f}%")
    print("="*60)
    
    if accuracy_top1 >= 95:
        print("\n✅ SUCCESS: System meets the 95% Accuracy Requirement.")
        print("   This metric validates the 'Retrieval Layer' of your architecture.")
    else:
        print("\n⚠️ WARNING: Accuracy is below 95%.")
        print("   Review the failures below to fix data mapping issues.")

    if failures:
        print("\n🔍 FAILURE ANALYSIS (Sample of Mismatches):")
        print("-" * 60)
        print(f"{'Target Disease':<30} | {'Rank':<5} | {'Actual Top Prediction'}")
        print("-" * 60)
        for fail in failures[:10]:  # Show first 10 failures
            print(f"{fail['disease']:<30} | {fail['rank']:<5} | {fail['top_prediction']}")
        print("-" * 60)

if __name__ == "__main__":
    calculate_retrieval_accuracy()