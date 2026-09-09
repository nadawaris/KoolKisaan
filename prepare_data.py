import csv
import json
import os
import re
from collections import Counter

# Define crop keywords for extracting crop from query text
CROP_KEYWORDS = {
    'Onion': r'\bonion\b',
    'Citrus': r'\bcitrus\b|\bacid lime\b|\bmosambi\b|\blemon\b',
    'Paddy/Rice': r'\bpaddy\b|\brice\b',
    'Wheat': r'\bwheat\b',
    'Cotton': r'\bcotton\b',
    'Orange': r'\borange\b',
    'Turmeric': r'\bturmeric\b',
    'Bengal Gram': r'\bbengal gram\b|\bgram\b',
    'Green Gram': r'\bgreen gram\b|\bmoong\b',
    'Black Gram': r'\bblack gram\b|\burad\b',
    'Pigeon Pea (Tur)': r'\btur\b|\barhar\b|\bpigeon pea\b',
    'Watermelon': r'\bwatermelon\b',
    'Sesame': r'\bsesame\b|\bsesamum\b',
    'Groundnut': r'\bgroundnut\b|\bpeanut\b',
    'Soybean': r'\bsoybean\b|\bsoya\b',
    'Chilli': r'\bchilli\b|\bchili\b|\bchilly\b',
    'Tomato': r'\btomato\b',
    'Brinjal': r'\bbrinjal\b|\beggplant\b',
    'Pomegranate': r'\bpomegranate\b',
    'Mango': r'\bmango\b',
    'Banana': r'\bbanana\b',
    'Sugarcane': r'\bsugarcane\b',
    'Potato': r'\bpotato\b',
    'Maize': r'\bmaize\b|\bcorn\b',
    'Ginger': r'\bginger\b',
    'Garlic': r'\bgarlic\b',
    'Grapes': r'\bgrapes\b',
}

def extract_crop(query_text):
    query_lower = query_text.lower()
    for crop, pattern in CROP_KEYWORDS.items():
        if re.search(pattern, query_lower):
            return crop
    return 'Other Crops'

# Load farmer queries
queries = []
crops_extracted = []
states = []
query_types = []
months = []

with open('raksha-farmer-query.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        crop = extract_crop(row['QueryText'])
        q_type = row['QueryType'].strip() if row['QueryType'] else 'Unknown'
        state = row['StateName'].strip() if row['StateName'] else 'Unknown'
        month = row['month'].strip() if row['month'] else 'Unknown'
        
        # Standardize query type names
        if q_type == 'Market':
            q_type = 'Market Rates & Info'
        
        query_obj = {
            'state': state,
            'district': row['DistrictName'].strip() if row['DistrictName'] else 'Unknown',
            'block': row['BlockName'].strip() if row['BlockName'] else 'Unknown',
            'season': row['Season'].strip() if row['Season'] else 'Unknown',
            'crop_extracted': crop,
            'query_type': q_type,
            'query_text': row['QueryText'].strip(),
            'created_on': row['CreatedOn'].strip() if row['CreatedOn'] else 'Unknown',
            'month': month
        }
        queries.append(query_obj)
        crops_extracted.append(crop)
        states.append(state)
        query_types.append(q_type)
        months.append(month)

# Load risk dataset
risk_data = []
with open('agri_ai_advisory_risk_dataset.csv', 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    for row in reader:
        risk_data.append({
            'farm_id': int(row['Farm_ID']),
            'region_type': row['Region_Type'].strip(),
            'crop': row['Crop'].strip(),
            'days_to_detect': int(row['Days_To_Detect_Disease']),
            'expert_access': int(row['Expert_Access']),
            'ai_advice_used': int(row['AI_Advice_Used']),
            'advice_validated': int(row['Advice_Validated_By_Expert']),
            'severity': float(row['Disease_Severity_Score']),
            'advisory_gap': float(row['Advisory_Gap_Score']),
            'wrong_decision': int(row['Wrong_Decision'])
        })

# Precompute stats
stats = {
    'total_queries': len(queries),
    'query_types': dict(Counter(query_types)),
    'states': dict(Counter(states)),
    'crops': dict(Counter(crops_extracted)),
    'months': dict(Counter(months)),
    'risk_stats': {
        'total_records': len(risk_data),
        'wrong_decisions': sum(r['wrong_decision'] for r in risk_data),
        'expert_validated': sum(r['advice_validated'] for r in risk_data),
        'avg_severity': sum(r['severity'] for r in risk_data) / len(risk_data),
        'avg_gap': sum(r['advisory_gap'] for r in risk_data) / len(risk_data),
        'region_distribution': dict(Counter(r['region_type'] for r in risk_data)),
        'region_wrong_decisions': dict(Counter(r['region_type'] for r in risk_data if r['wrong_decision'] == 1)),
        'expert_validation_wrong_decisions': {
            'validated': sum(1 for r in risk_data if r['advice_validated'] == 1 and r['wrong_decision'] == 1),
            'not_validated': sum(1 for r in risk_data if r['advice_validated'] == 0 and r['wrong_decision'] == 1),
            'total_validated': sum(1 for r in risk_data if r['advice_validated'] == 1),
            'total_not_validated': sum(1 for r in risk_data if r['advice_validated'] == 0)
        }
    }
}

# Create data directory if not exists
os.makedirs('data', exist_ok=True)

# Write files
with open('data/queries.json', 'w', encoding='utf-8') as f:
    json.dump(queries, f, indent=2, ensure_ascii=False)

with open('data/risk_data.json', 'w', encoding='utf-8') as f:
    json.dump(risk_data, f, indent=2, ensure_ascii=False)

with open('data/stats.json', 'w', encoding='utf-8') as f:
    json.dump(stats, f, indent=2, ensure_ascii=False)

print("Preprocessing complete!")
print(f"Saved {len(queries)} queries to data/queries.json")
print(f"Saved {len(risk_data)} risk records to data/risk_data.json")
print("Saved aggregates to data/stats.json")
