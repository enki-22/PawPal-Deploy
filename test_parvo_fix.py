from smart_triage_engine import SmartTriageEngine

engine = SmartTriageEngine('knowledge_base_enhanced.csv')

result = engine.diagnose('Dog', ['vomiting', 'bloody_diarrhea', 'lethargy'], top_n=5)

print('='*70)
print('TEST: Parvo Fix Verification')
print('='*70)
print('Input: vomiting, bloody_diarrhea, lethargy')

print('\nTop 3 Results:')
for i, m in enumerate(result['top_matches'][:3]):
    print(f"\n{i+1}. {m['disease']} ({m['match_percentage']}% match)")
    print(f"   Matched: {', '.join(m['matched_symptoms'][:5])}")
    print(f"   User coverage: {m['user_coverage']}%")

if result['top_matches'][0]['disease'] == 'Canine parvovirus':
    print('\n✅ SUCCESS: Canine parvovirus is #1!')
else:
    print(f"\n❌ FAILED - Top result: {result['top_matches'][0]['disease']}")
print('='*70)
