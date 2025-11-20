import json

with open('pawpal_disease_metadata.json', 'r') as f:
    metadata = json.load(f)

print(f"Total Diseases: {len(metadata)}\n")
for disease in sorted(metadata.keys()):
    print(disease)
    print("="*80)
    print(f"\nTotal Diseases: {len(metadata)}\n")
    
    # Group by urgency
    by_urgency = defaultdict(list)
    for disease, info in metadata.items():
        urgency = info.get('urgency', 'unknown')
        by_urgency[urgency].append((disease, info))
    
    # Sort urgency levels
    urgency_order = ['emergency', 'critical', 'severe', 'high', 'medium', 'moderate', 'mild', 'low', 'unknown']
    
    for urgency in urgency_order:
        if urgency in by_urgency:
            diseases = by_urgency[urgency]
            print(f"\n{'='*80}")
            print(f"📊 {urgency.upper()} URGENCY ({len(diseases)} diseases)")
            print(f"{'='*80}")
            
            for disease, info in sorted(diseases, key=lambda x: x[0]):
                species = info.get('species', [])
                contagious = info.get('contagious', False)
                symptoms = info.get('sample_symptoms', '')
                
                print(f"\n  🦠 {disease}")
                print(f"     Urgency: {urgency}")
                print(f"     Species: {', '.join(species) if species else 'Not specified'}")
                print(f"     Contagious: {'Yes' if contagious else 'No'}")
                if symptoms:
                    print(f"     Symptoms: {symptoms}")

def list_by_species():
    """List diseases grouped by species."""
    metadata = load_metadata()
    
    by_species = defaultdict(list)
    for disease, info in metadata.items():
        species_list = info.get('species', ['Unknown'])
        for species in species_list:
            by_species[species].append(disease)
    
    print("\n" + "="*80)
    print("🐾 DISEASES BY SPECIES")
    print("="*80)
    
    for species in sorted(by_species.keys()):
        diseases = sorted(by_species[species])
        print(f"\n{species}: {len(diseases)} diseases")
        for disease in diseases:
            urgency = metadata[disease].get('urgency', 'unknown')
            print(f"  • {disease} ({urgency})")

def list_critical_diseases():
    """List only critical/emergency diseases."""
    metadata = load_metadata()
    
    critical = {}
    for disease, info in metadata.items():
        urgency = info.get('urgency', '').lower()
        if urgency in ['emergency', 'critical', 'severe']:
            critical[disease] = info
    
    print("\n" + "="*80)
    print("🚨 CRITICAL/EMERGENCY/SEVERE DISEASES")
    print("="*80)
    print(f"\nTotal: {len(critical)} diseases\n")
    
    for disease in sorted(critical.keys()):
        info = critical[disease]
        urgency = info.get('urgency', 'unknown')
        species = info.get('species', [])
        contagious = info.get('contagious', False)
        
        print(f"  🚨 {disease}")
        print(f"     Urgency: {urgency}")
        print(f"     Species: {', '.join(species) if species else 'Not specified'}")
        print(f"     Contagious: {'Yes ⚠️' if contagious else 'No'}")
        print()

def list_contagious_diseases():
    """List contagious diseases."""
    metadata = load_metadata()
    
    contagious = {}
    for disease, info in metadata.items():
        if info.get('contagious', False):
            contagious[disease] = info
    
    print("\n" + "="*80)
    print("⚠️  CONTAGIOUS DISEASES")
    print("="*80)
    print(f"\nTotal: {len(contagious)} diseases\n")
    
    for disease in sorted(contagious.keys()):
        info = contagious[disease]
        urgency = info.get('urgency', 'unknown')
        species = info.get('species', [])
        
        print(f"  ⚠️  {disease}")
        print(f"     Urgency: {urgency}")
        print(f"     Species: {', '.join(species) if species else 'Not specified'}")
        print()

def search_disease(query):
    """Search for a specific disease."""
    metadata = load_metadata()
    query_lower = query.lower()
    
    results = {}
    for disease, info in metadata.items():
        if query_lower in disease.lower():
            results[disease] = info
    
    if not results:
        print(f"\n❌ No diseases found matching '{query}'")
        return
    
    print(f"\n" + "="*80)
    print(f"🔍 SEARCH RESULTS FOR '{query}' ({len(results)} found)")
    print("="*80)
    
    for disease in sorted(results.keys()):
        info = results[disease]
        urgency = info.get('urgency', 'unknown')
        species = info.get('species', [])
        contagious = info.get('contagious', False)
        symptoms = info.get('sample_symptoms', '')
        
        print(f"\n  {disease}")
        print(f"    Urgency: {urgency}")
        print(f"    Species: {', '.join(species) if species else 'Not specified'}")
        print(f"    Contagious: {'Yes' if contagious else 'No'}")
        if symptoms:
            print(f"    Symptoms: {symptoms}")

def print_menu():
    """Print the menu."""
    print("\n" + "="*80)
    print("🏥 PAWPAL DISEASE DATABASE VIEWER")
    print("="*80)
    print("\nOptions:")
    print("  1. List all diseases by urgency")
    print("  2. List diseases by species")
    print("  3. List critical/emergency/severe diseases only")
    print("  4. List contagious diseases")
    print("  5. Search for a specific disease")
    print("  6. Exit")
    print()

if __name__ == '__main__':
    if len(sys.argv) > 1:
        # Command line argument provided
        command = sys.argv[1].lower()
        
        if command == 'all':
            list_all_diseases()
        elif command == 'species':
            list_by_species()
        elif command == 'critical':
            list_critical_diseases()
        elif command == 'contagious':
            list_contagious_diseases()
        elif command.startswith('search:'):
            query = command.replace('search:', '')
            search_disease(query)
        else:
            print(f"Unknown command: {command}")
            print("\nUsage:")
            print("  python critical_check.py all          # List all diseases")
            print("  python critical_check.py species      # List by species")
            print("  python critical_check.py critical     # List critical diseases")
            print("  python critical_check.py contagious   # List contagious diseases")
            print("  python critical_check.py search:name  # Search for disease")
    else:
        # Interactive menu
        while True:
            print_menu()
            choice = input("Enter your choice (1-6): ").strip()
            
            if choice == '1':
                list_all_diseases()
            elif choice == '2':
                list_by_species()
            elif choice == '3':
                list_critical_diseases()
            elif choice == '4':
                list_contagious_diseases()
            elif choice == '5':
                query = input("Enter disease name to search: ").strip()
                if query:
                    search_disease(query)
            elif choice == '6':
                print("\nGoodbye! 👋")
                break
            else:
                print("❌ Invalid choice. Please try again.")