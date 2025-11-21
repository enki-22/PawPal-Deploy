from smart_triage_engine import SmartTriageEngine

engine = SmartTriageEngine('knowledge_base_enhanced.csv')

print('='*70)
print('TEST: Addisons Disease Detection')
print('='*70)

# Test Addison's
result = engine.diagnose('Dog', ['muscle_tremors', 'shaking', 'weakness', 'increased_thirst'], top_n=3)
print('Input: muscle_tremors, shaking, weakness, increased_thirst')
print('\nTop 3 Results:')
for i, m in enumerate(result['top_matches'][:3]):
    print(f"\n{i+1}. {m['disease']} ({m['match_percentage']}% match)")
    print(f"   Matched: {', '.join(m['matched_symptoms'][:5])}")
    print(f"   User coverage: {m['user_coverage']}%")

print('='*70)
