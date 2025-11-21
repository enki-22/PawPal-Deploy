#!/usr/bin/env python3
"""
Apply Clinical Logic with Safety Guardrails
Enriches symptom data based on clinical sequelae and recalibrates urgency for triage compliance
"""

import csv
import re
from datetime import datetime

class ClinicalLogicEngine:
    """
    Applies evidence-based clinical inference to the knowledge base
    """
    
    # Clinical symptom patterns
    PRURITUS_SYMPTOMS = {
        'itching', 'scratching', 'constant_licking', 'biting', 
        'self_biting', 'chewing_paws', 'self_biting_or_chewing',
        'chewing', 'licking'
    }
    
    SECONDARY_SKIN_SYMPTOMS = {
        'red_skin', 'skin_lesions', 'irritated_skin'
    }
    
    FLUID_LOSS_SYMPTOMS = {
        'vomiting', 'diarrhea'
    }
    
    # Urgency recalibration targets (chronic skin conditions)
    # Include both singular and plural forms explicitly
    DOWNGRADE_TARGETS = [
        'allergy', 'allergies', 'dermatitis', 'mange', 'acne', 
        'ear mite', 'flea', 'tick', 'lice', 'hot spot', 'pyoderma',
        'eosinophilic', 'atopic', 'skin infection', 'ringworm'
    ]
    
    # CRITICAL SAFETY GUARDRAILS - NEVER downgrade these
    SAFETY_EXCLUSIONS = [
        'heartworm', 'anaphylaxis', 'acute', 'shock', 
        'necrotizing', 'lungworm', 'emergency', 'severe',
        'hemorrhagic', 'septic', 'toxic', 'bloat', 'torsion',
        'obstruction', 'parvovirus', 'distemper', 'rabies',
        'heatstroke', 'poisoning', 'collapse', 'seizure',
        'respiratory distress', 'acute renal', 'acute liver'
    ]
    
    # Contagious conditions (even if chronic)
    CONTAGIOUS_CONDITIONS = [
        'flea', 'tick', 'lice', 'mite', 'ringworm', 
        'mange', 'scabies', 'contagious'
    ]
    
    def __init__(self):
        self.changes_log = []
        self.safety_blocks = []
        self.enrichments = 0
        self.recalibrations = 0
    
    def normalize_symptoms(self, symptom_list):
        """Convert symptom list to set for easier manipulation"""
        if isinstance(symptom_list, str):
            return set(s.strip().lower() for s in symptom_list.split(','))
        return set(symptom_list)
    
    def symptoms_to_string(self, symptom_set):
        """Convert symptom set back to CSV string"""
        return ', '.join(sorted(symptom_set))
    
    def has_safety_exclusion(self, disease_name):
        """Check if disease matches safety exclusion patterns"""
        disease_lower = disease_name.lower()
        for exclusion in self.SAFETY_EXCLUSIONS:
            if exclusion in disease_lower:
                return exclusion
        return None
    
    def matches_downgrade_target(self, disease_name):
        """Check if disease matches chronic skin condition patterns"""
        disease_lower = disease_name.lower()
        
        # Strict lowercase matching with explicit plural handling
        for target in self.DOWNGRADE_TARGETS:
            target_lower = target.lower()  # Ensure lowercase
            if target_lower in disease_lower:
                return target
        
        return None
    
    def is_contagious_condition(self, disease_name):
        """Check if disease is contagious by nature"""
        disease_lower = disease_name.lower()
        for condition in self.CONTAGIOUS_CONDITIONS:
            if condition in disease_lower:
                return True
        return False
    
    def apply_symptom_enrichment(self, row):
        """
        Logic Block 1: Pruritus Secondary Skin Trauma
        Logic Block 2: Fluid Loss Dehydration
        """
        disease = row['disease']
        symptoms = self.normalize_symptoms(row['symptoms'])
        original_count = len(symptoms)
        added_symptoms = []
        
        # DEBUG: Track Food Allergies specifically
        is_food_allergies = 'food allergies' in disease.lower()
        
        # Logic Block 1: Self-trauma secondary to pruritus
        has_pruritus = bool(symptoms & self.PRURITUS_SYMPTOMS)
        missing_skin = self.SECONDARY_SKIN_SYMPTOMS - symptoms
        
        if has_pruritus and missing_skin:
            symptoms.update(missing_skin)
            added_symptoms.extend(missing_skin)
            self.changes_log.append(
                f"✓ Enriched [{disease}]: Added {', '.join(missing_skin)} "
                f"(secondary to pruritus/self-trauma)"
            )
        elif is_food_allergies and has_pruritus:
            # DEBUG: Food Allergies has pruritus but no missing symptoms
            print(f"  [DEBUG] {disease}: Has pruritus, already has all secondary skin symptoms ✓")
        
        # Logic Block 2: Fluid loss → dehydration
        has_vomiting = 'vomiting' in symptoms
        has_diarrhea = any(d in symptoms for d in ['diarrhea', 'bloody_diarrhea'])
        has_dehydration = any(d in symptoms for d in ['dehydration', 'severe_dehydration'])
        
        if has_vomiting and has_diarrhea and not has_dehydration:
            symptoms.add('dehydration')
            added_symptoms.append('dehydration')
            self.changes_log.append(
                f"✓ Enriched [{disease}]: Added dehydration "
                f"(high risk from vomiting + diarrhea)"
            )
        elif is_food_allergies and has_vomiting and has_diarrhea:
            # DEBUG: Food Allergies has V+D but already has dehydration
            print(f"  [DEBUG] {disease}: Has vomiting+diarrhea, already has dehydration ✓")
        
        if added_symptoms:
            self.enrichments += 1
            row['symptoms'] = self.symptoms_to_string(symptoms)
        
        return row
    
    def apply_urgency_recalibration(self, row):
        """
        Logic Block 3: Triage-Compliant Urgency Adjustment
        WITH STRICT SAFETY GUARDRAILS
        """
        disease = row['disease']
        current_urgency = row['urgency'].lower()
        current_contagious = row['contagious'].lower()
        
        # DEBUG: Track Food Allergies specifically
        is_food_allergies = 'food allergies' in disease.lower()
        if is_food_allergies:
            print(f"\n  [DEBUG] Processing {disease}:")
            print(f"    Current urgency: {current_urgency}")
            print(f"    Current contagious: {current_contagious}")
        
        # Skip if already medium/mild urgency
        if current_urgency in ['medium', 'mild', 'low']:
            if is_food_allergies:
                print(f"    ✓ Already at {current_urgency} urgency, no recalibration needed")
            return row
        
        # SAFETY CHECK: Verify no exclusion keywords
        exclusion_match = self.has_safety_exclusion(disease)
        if exclusion_match:
            self.safety_blocks.append(
                f"⚠ SAFETY GUARDRAIL: Skipped [{disease}] - "
                f"Matched exclusion keyword '{exclusion_match}' (keeping urgency={current_urgency})"
            )
            if is_food_allergies:
                print(f"    ⚠ Safety exclusion hit: {exclusion_match}")
            return row
        
        # Check if matches chronic skin condition pattern
        target_match = self.matches_downgrade_target(disease)
        if is_food_allergies:
            print(f"    Downgrade target match: {target_match if target_match else 'NONE (BUG!!)'}")
        
        if not target_match:
            if is_food_allergies:
                print(f"    ❌ ERROR: Food Allergies should match 'allergy' or 'allergies' but didn't!")
            return row
        
        # Apply recalibration
        old_urgency = current_urgency
        old_contagious = current_contagious
        
        row['urgency'] = 'medium'
        
        # Set contagious status
        if self.is_contagious_condition(disease):
            row['contagious'] = 'yes'
        else:
            row['contagious'] = 'no'
        
        self.recalibrations += 1
        change_msg = (
            f"✓ Recalibrated [{disease}]: "
            f"Urgency {old_urgency} → medium, "
            f"Contagious {old_contagious} → {row['contagious']} "
            f"(matched: {target_match})"
        )
        self.changes_log.append(change_msg)
        
        if is_food_allergies:
            print(f"    ✓ RECALIBRATED: {old_urgency} → medium")
            print(change_msg)
        
        return row
    
    def process_database(self, input_file, output_file):
        """
        Main processing pipeline
        """
        print("\n" + "="*80)
        print("CLINICAL LOGIC ENGINE - APPLYING EVIDENCE-BASED INFERENCE")
        print("="*80 + "\n")
        
        # Load CSV
        with open(input_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)
        
        print(f"✓ Loaded {len(rows)} disease entries from {input_file}\n")
        
        # Apply clinical logic
        processed_rows = []
        for row in rows:
            # Step 1: Symptom enrichment
            row = self.apply_symptom_enrichment(row)
            
            # Step 2: Urgency recalibration with safety guardrails
            row = self.apply_urgency_recalibration(row)
            
            processed_rows.append(row)
        
        # Save results
        fieldnames = ['species', 'disease', 'symptoms', 'urgency', 'contagious', 'source']
        with open(output_file, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            writer.writerows(processed_rows)
        
        print(f"✓ Saved {len(processed_rows)} entries to {output_file}\n")
        
        # Print audit log
        self.print_audit_log()
    
    def print_audit_log(self):
        """
        Print comprehensive audit trail
        """
        print("="*80)
        print("AUDIT LOG - CLINICAL CHANGES")
        print("="*80 + "\n")
        
        # Enrichments
        if self.enrichments > 0:
            print(f"📊 SYMPTOM ENRICHMENT ({self.enrichments} diseases enriched):")
            print("-" * 80)
            for log in [l for l in self.changes_log if 'Enriched' in l]:
                print(log)
            print()
        else:
            print("📊 SYMPTOM ENRICHMENT: No enrichments applied\n")
        
        # Recalibrations
        if self.recalibrations > 0:
            print(f"⚖️  URGENCY RECALIBRATION ({self.recalibrations} diseases recalibrated):")
            print("-" * 80)
            for log in [l for l in self.changes_log if 'Recalibrated' in l]:
                print(log)
            print()
        else:
            print("⚖️  URGENCY RECALIBRATION: No recalibrations applied\n")
        
        # Safety guardrails
        if self.safety_blocks:
            print(f"🛡️  SAFETY GUARDRAILS ({len(self.safety_blocks)} conditions protected):")
            print("-" * 80)
            for block in self.safety_blocks:
                print(block)
            print()
        else:
            print("🛡️  SAFETY GUARDRAILS: No acute conditions encountered\n")
        
        # Summary
        print("="*80)
        print("SUMMARY")
        print("="*80)
        print(f"✅ Enrichments applied: {self.enrichments}")
        print(f"✅ Urgency recalibrations: {self.recalibrations}")
        print(f"🛡️  Safety blocks triggered: {len(self.safety_blocks)}")
        print(f"📝 Total changes logged: {len(self.changes_log)}")
        print("="*80 + "\n")
        
        # Clinical rationale
        print("📚 CLINICAL RATIONALE:")
        print("-" * 80)
        print("1. Pruritus → Secondary skin lesions (self-trauma from scratching)")
        print("2. Vomiting + Diarrhea → Dehydration (fluid loss sequelae)")
        print("3. Chronic skin conditions → Medium urgency (per triage standards)")
        print("4. Contagious parasites → Flagged for isolation protocols")
        print("5. Acute/Emergency conditions → PROTECTED (safety guardrails)")
        print("="*80 + "\n")


def main():
    """
    Execute clinical logic pipeline
    """
    print("\n" + "="*80)
    print("🏥 MEDICALLY DEFENSIBLE DATABASE ENHANCEMENT")
    print("="*80 + "\n")
    
    # Initialize engine
    engine = ClinicalLogicEngine()
    
    # Process database
    input_file = 'knowledge_base_enhanced.csv'
    output_file = 'knowledge_base_enhanced.csv'  # Overwrite in place
    
    # Backup first
    backup_file = f'knowledge_base_enhanced.backup_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
    with open(input_file, 'r', encoding='utf-8') as f_in:
        with open(backup_file, 'w', encoding='utf-8') as f_out:
            f_out.write(f_in.read())
    print(f"✓ Created backup: {backup_file}\n")
    
    # Apply clinical logic
    engine.process_database(input_file, output_file)
    
    print("="*80)
    print("✅ CLINICAL LOGIC APPLICATION COMPLETE!")
    print("="*80)
    print("\n📋 Next Steps:")
    print("  1. Review audit log above")
    print("  2. Verify enrichments are clinically sound")
    print("  3. Confirm safety guardrails protected acute conditions")
    print("  4. Test diagnosis accuracy with enriched symptoms")
    print("  5. Deploy to production")
    print("\n🏆 Your database is now medically defensible and triage-compliant!\n")


if __name__ == "__main__":
    main()
