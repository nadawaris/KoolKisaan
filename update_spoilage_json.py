import json
import csv
import os

raw_data = [
    {"record_id": 1, "date": "2025-02-0", "location": "Village_C", "crop": "Tomato", "temp": 32.6, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 2, "date": "2025-02-0", "location": "Village_A", "crop": "Onion", "temp": 27.2, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 3, "date": "2025-02-0", "location": "Village_C", "crop": "Onion", "temp": 21.1, "spoilage": "Yes", "storage": "No"},
    {"record_id": 4, "date": "2025-02-0", "location": "Village_B", "crop": "Wheat", "temp": 34.9, "spoilage": "No", "storage": "Yes"},
    {"record_id": 5, "date": "2025-02-0", "location": "Village_C", "crop": "Potato", "temp": 32.5, "spoilage": "Yes", "storage": "No"},
    {"record_id": 6, "date": "2025-02-0", "location": "Village_B", "crop": "Wheat", "temp": 38.7, "spoilage": "Yes", "storage": "No"},
    {"record_id": 7, "date": "2025-02-0", "location": "Village_B", "crop": "Tomato", "temp": 28.7, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 8, "date": "2025-02-0", "location": "Village_B", "crop": "Maize", "temp": 33.4, "spoilage": "No", "storage": "No"},
    {"record_id": 9, "date": "2025-02-1", "location": "Village_B", "crop": "Wheat", "temp": 22.8, "spoilage": "No", "storage": "No"},
    {"record_id": 10, "date": "2025-02-1", "location": "Village_C", "crop": "Potato", "temp": 28.0, "spoilage": "No", "storage": "No"},
    {"record_id": 11, "date": "2025-02-1", "location": "Village_B", "crop": "Onion", "temp": 41.4, "spoilage": "No", "storage": "Yes"},
    {"record_id": 12, "date": "2025-02-1", "location": "Village_A", "crop": "Tomato", "temp": 24.6, "spoilage": "No", "storage": "Yes"},
    {"record_id": 13, "date": "2025-02-1", "location": "Village_C", "crop": "Tomato", "temp": 33.4, "spoilage": "Yes", "storage": "No"},
    {"record_id": 14, "date": "2025-02-1", "location": "Village_B", "crop": "Wheat", "temp": 25.7, "spoilage": "No", "storage": "Yes"},
    {"record_id": 15, "date": "2025-02-1", "location": "Village_B", "crop": "Tomato", "temp": 30.9, "spoilage": "No", "storage": "Yes"},
    {"record_id": 16, "date": "2025-02-1", "location": "Village_C", "crop": "Wheat", "temp": 27.9, "spoilage": "No", "storage": "Yes"},
    {"record_id": 17, "date": "2025-02-1", "location": "Village_C", "crop": "Potato", "temp": 41.8, "spoilage": "No", "storage": "No"},
    {"record_id": 18, "date": "2025-02-1", "location": "Village_A", "crop": "Maize", "temp": 25.9, "spoilage": "Yes", "storage": "No"},
    {"record_id": 19, "date": "2025-02-2", "location": "Village_C", "crop": "Onion", "temp": 22.8, "spoilage": "No", "storage": "Yes"},
    {"record_id": 20, "date": "2025-02-2", "location": "Village_A", "crop": "Maize", "temp": 38.6, "spoilage": "No", "storage": "No"},
    {"record_id": 21, "date": "2025-02-2", "location": "Village_B", "crop": "Potato", "temp": 31.9, "spoilage": "No", "storage": "No"},
    {"record_id": 22, "date": "2025-02-2", "location": "Village_A", "crop": "Onion", "temp": 24.4, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 23, "date": "2025-02-2", "location": "Village_A", "crop": "Maize", "temp": 25.9, "spoilage": "No", "storage": "Yes"},
    {"record_id": 24, "date": "2025-02-2", "location": "Village_B", "crop": "Onion", "temp": 25.0, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 25, "date": "2025-02-2", "location": "Village_C", "crop": "Potato", "temp": 37.8, "spoilage": "Yes", "storage": "No"},
    {"record_id": 26, "date": "2025-02-2", "location": "Village_B", "crop": "Tomato", "temp": 34.3, "spoilage": "No", "storage": "No"},
    {"record_id": 27, "date": "2025-02-2", "location": "Village_C", "crop": "Onion", "temp": 31.7, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 28, "date": "2025-02-0", "location": "Village_C", "crop": "Maize", "temp": 29.1, "spoilage": "Yes", "storage": "No"},
    {"record_id": 29, "date": "2025-02-0", "location": "Village_C", "crop": "Maize", "temp": 38.6, "spoilage": "No", "storage": "Yes"},
    {"record_id": 30, "date": "2025-02-0", "location": "Village_C", "crop": "Tomato", "temp": 38.9, "spoilage": "No", "storage": "No"},
    {"record_id": 31, "date": "2025-02-0", "location": "Village_A", "crop": "Onion", "temp": 23.6, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 32, "date": "2025-02-0", "location": "Village_B", "crop": "Potato", "temp": 33.6, "spoilage": "No", "storage": "No"},
    {"record_id": 33, "date": "2025-02-0", "location": "Village_C", "crop": "Onion", "temp": 24.4, "spoilage": "Yes", "storage": "No"},
    {"record_id": 34, "date": "2025-02-0", "location": "Village_C", "crop": "Onion", "temp": 25.1, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 35, "date": "2025-02-0", "location": "Village_C", "crop": "Onion", "temp": 29.9, "spoilage": "No", "storage": "Yes"},
    {"record_id": 36, "date": "2025-02-0", "location": "Village_C", "crop": "Potato", "temp": 21.2, "spoilage": "Yes", "storage": "No"},
    {"record_id": 37, "date": "2025-02-1", "location": "Village_B", "crop": "Wheat", "temp": 30.2, "spoilage": "No", "storage": "No"},
    {"record_id": 38, "date": "2025-02-1", "location": "Village_A", "crop": "Maize", "temp": 25.0, "spoilage": "No", "storage": "No"},
    {"record_id": 39, "date": "2025-02-1", "location": "Village_B", "crop": "Maize", "temp": 34.4, "spoilage": "Yes", "storage": "No"},
    {"record_id": 40, "date": "2025-02-1", "location": "Village_A", "crop": "Potato", "temp": 31.2, "spoilage": "No", "storage": "Yes"},
    {"record_id": 41, "date": "2025-02-1", "location": "Village_C", "crop": "Onion", "temp": 38.2, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 42, "date": "2025-02-1", "location": "Village_A", "crop": "Tomato", "temp": 28.1, "spoilage": "No", "storage": "No"},
    {"record_id": 43, "date": "2025-02-1", "location": "Village_C", "crop": "Onion", "temp": 28.8, "spoilage": "No", "storage": "No"},
    {"record_id": 44, "date": "2025-02-1", "location": "Village_C", "crop": "Tomato", "temp": 32.4, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 45, "date": "2025-02-1", "location": "Village_A", "crop": "Tomato", "temp": 30.2, "spoilage": "Yes", "storage": "No"},
    {"record_id": 46, "date": "2025-02-1", "location": "Village_A", "crop": "Wheat", "temp": 41.7, "spoilage": "No", "storage": "Yes"},
    {"record_id": 47, "date": "2025-02-2", "location": "Village_B", "crop": "Maize", "temp": 39.6, "spoilage": "No", "storage": "No"},
    {"record_id": 48, "date": "2025-02-2", "location": "Village_A", "crop": "Maize", "temp": 24.7, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 49, "date": "2025-02-2", "location": "Village_B", "crop": "Maize", "temp": 34.7, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 50, "date": "2025-02-2", "location": "Village_C", "crop": "Maize", "temp": 21.5, "spoilage": "No", "storage": "No"},
    {"record_id": 51, "date": "2025-02-2", "location": "Village_B", "crop": "Potato", "temp": 33.9, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 52, "date": "2025-02-2", "location": "Village_C", "crop": "Potato", "temp": 35.8, "spoilage": "No", "storage": "Yes"},
    {"record_id": 53, "date": "2025-02-2", "location": "Village_B", "crop": "Wheat", "temp": 21.7, "spoilage": "No", "storage": "Yes"},
    {"record_id": 54, "date": "2025-02-2", "location": "Village_C", "crop": "Tomato", "temp": 31.9, "spoilage": "Yes", "storage": "No"},
    {"record_id": 55, "date": "2025-02-2", "location": "Village_A", "crop": "Wheat", "temp": 24.6, "spoilage": "Yes", "storage": "No"},
    {"record_id": 56, "date": "2025-02-2", "location": "Village_A", "crop": "Wheat", "temp": 22.5, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 57, "date": "2025-02-2", "location": "Village_A", "crop": "Potato", "temp": 21.6, "spoilage": "No", "storage": "No"},
    {"record_id": 58, "date": "2025-02-2", "location": "Village_C", "crop": "Onion", "temp": 33.8, "spoilage": "Yes", "storage": "No"},
    {"record_id": 59, "date": "2025-02-2", "location": "Village_B", "crop": "Maize", "temp": 21.2, "spoilage": "No", "storage": "No"},
    {"record_id": 60, "date": "2025-02-0", "location": "Village_B", "crop": "Onion", "temp": 37.0, "spoilage": "No", "storage": "Yes"},
    {"record_id": 61, "date": "2025-02-0", "location": "Village_A", "crop": "Wheat", "temp": 21.6, "spoilage": "No", "storage": "No"},
    {"record_id": 62, "date": "2025-02-0", "location": "Village_B", "crop": "Maize", "temp": 31.2, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 63, "date": "2025-02-0", "location": "Village_B", "crop": "Potato", "temp": 40.5, "spoilage": "No", "storage": "No"},
    {"record_id": 64, "date": "2025-02-0", "location": "Village_A", "crop": "Maize", "temp": 39.4, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 65, "date": "2025-02-0", "location": "Village_B", "crop": "Maize", "temp": 33.9, "spoilage": "No", "storage": "No"},
    {"record_id": 66, "date": "2025-02-1", "location": "Village_C", "crop": "Wheat", "temp": 20.4, "spoilage": "Yes", "storage": "No"},
    {"record_id": 67, "date": "2025-02-1", "location": "Village_C", "crop": "Potato", "temp": 34.5, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 68, "date": "2025-02-1", "location": "Village_A", "crop": "Tomato", "temp": 37.5, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 69, "date": "2025-02-1", "location": "Village_A", "crop": "Wheat", "temp": 25.5, "spoilage": "No", "storage": "Yes"},
    {"record_id": 70, "date": "2025-02-1", "location": "Village_A", "crop": "Wheat", "temp": 26.3, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 71, "date": "2025-02-1", "location": "Village_B", "crop": "Potato", "temp": 32.5, "spoilage": "Yes", "storage": "No"},
    {"record_id": 72, "date": "2025-02-2", "location": "Village_A", "crop": "Onion", "temp": 39.1, "spoilage": "Yes", "storage": "No"},
    {"record_id": 73, "date": "2025-02-2", "location": "Village_C", "crop": "Potato", "temp": 21.5, "spoilage": "Yes", "storage": "No"},
    {"record_id": 74, "date": "2025-02-1", "location": "Village_C", "crop": "Wheat", "temp": 28.7, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 75, "date": "2025-02-2", "location": "Village_B", "crop": "Onion", "temp": 20.7, "spoilage": "Yes", "storage": "No"},
    {"record_id": 76, "date": "2025-02-2", "location": "Village_B", "crop": "Tomato", "temp": 32.1, "spoilage": "Yes", "storage": "No"},
    {"record_id": 77, "date": "2025-02-2", "location": "Village_C", "crop": "Onion", "temp": 24.2, "spoilage": "Yes", "storage": "No"},
    {"record_id": 78, "date": "2025-02-2", "location": "Village_A", "crop": "Potato", "temp": 22.6, "spoilage": "Yes", "storage": "No"},
    {"record_id": 79, "date": "2025-02-2", "location": "Village_B", "crop": "Maize", "temp": 24.2, "spoilage": "No", "storage": "No"},
    {"record_id": 80, "date": "2025-02-2", "location": "Village_C", "crop": "Onion", "temp": 31.8, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 81, "date": "2025-02-2", "location": "Village_A", "crop": "Tomato", "temp": 32.4, "spoilage": "No", "storage": "Yes"},
    {"record_id": 82, "date": "2025-02-2", "location": "Village_B", "crop": "Potato", "temp": 20.9, "spoilage": "No", "storage": "No"},
    {"record_id": 83, "date": "2025-02-2", "location": "Village_A", "crop": "Tomato", "temp": 38.0, "spoilage": "No", "storage": "No"},
    {"record_id": 84, "date": "2025-02-2", "location": "Village_A", "crop": "Wheat", "temp": 32.9, "spoilage": "No", "storage": "Yes"},
    {"record_id": 85, "date": "2025-02-0", "location": "Village_A", "crop": "Maize", "temp": 26.5, "spoilage": "Yes", "storage": "No"},
    {"record_id": 86, "date": "2025-02-0", "location": "Village_B", "crop": "Maize", "temp": 27.5, "spoilage": "Yes", "storage": "No"},
    {"record_id": 87, "date": "2025-02-0", "location": "Village_A", "crop": "Maize", "temp": 21.9, "spoilage": "No", "storage": "No"},
    {"record_id": 88, "date": "2025-02-0", "location": "Village_B", "crop": "Wheat", "temp": 41.6, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 89, "date": "2025-02-0", "location": "Village_A", "crop": "Maize", "temp": 22.7, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 90, "date": "2025-02-0", "location": "Village_C", "crop": "Potato", "temp": 28.8, "spoilage": "Yes", "storage": "No"},
    {"record_id": 91, "date": "2025-02-0", "location": "Village_B", "crop": "Potato", "temp": 23.7, "spoilage": "No", "storage": "No"},
    {"record_id": 92, "date": "2025-02-0", "location": "Village_A", "crop": "Potato", "temp": 23.7, "spoilage": "No", "storage": "Yes"},
    {"record_id": 93, "date": "2025-02-1", "location": "Village_C", "crop": "Onion", "temp": 36.9, "spoilage": "No", "storage": "Yes"},
    {"record_id": 94, "date": "2025-02-1", "location": "Village_C", "crop": "Onion", "temp": 27.8, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 95, "date": "2025-02-1", "location": "Village_A", "crop": "Maize", "temp": 39.3, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 96, "date": "2025-02-1", "location": "Village_C", "crop": "Wheat", "temp": 20.4, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 97, "date": "2025-02-1", "location": "Village_A", "crop": "Onion", "temp": 30.7, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 98, "date": "2025-02-1", "location": "Village_C", "crop": "Potato", "temp": 42.0, "spoilage": "Yes", "storage": "Yes"},
    {"record_id": 99, "date": "2025-02-1", "location": "Village_C", "crop": "Maize", "temp": 40.2, "spoilage": "Yes", "storage": "No"},
    {"record_id": 100, "date": "2025-02-1", "location": "Village_B", "crop": "Onion", "temp": 39.5, "spoilage": "No", "storage": "Yes"}
]

# Save to data/spoilage.json
os.makedirs('data', exist_ok=True)
with open('data/spoilage.json', 'w') as f:
    json.dump(raw_data, f, indent=2)

# Load existing stats.json
with open('data/stats.json', 'r') as f:
    stats = json.load(f)

# Calculate Spoilage Rates
crop_totals = {}
crop_spoiled = {}
for r in raw_data:
    c = r["crop"]
    s = 1 if r["spoilage"] == "Yes" else 0
    crop_totals[c] = crop_totals.get(c, 0) + 1
    crop_spoiled[c] = crop_spoiled.get(c, 0) + s

spoilage_rates = {}
for c in crop_totals:
    spoilage_rates[c] = round((crop_spoiled[c] / crop_totals[c]) * 100, 1)

# Temp Bin statistics
temp_bins = {"< 25C": {"total": 0, "spoiled": 0},
             "25C - 30C": {"total": 0, "spoiled": 0},
             "30C - 35C": {"total": 0, "spoiled": 0},
             "> 35C": {"total": 0, "spoiled": 0}}

for r in raw_data:
    temp = r["temp"]
    s = 1 if r["spoilage"] == "Yes" else 0
    if temp < 25:
        b = "< 25C"
    elif temp <= 30:
        b = "25C - 30C"
    elif temp <= 35:
        b = "30C - 35C"
    else:
        b = "> 35C"
    temp_bins[b]["total"] += 1
    temp_bins[b]["spoiled"] += s

temp_bin_rates = {}
for b in temp_bins:
    t = temp_bins[b]["total"]
    sp = temp_bins[b]["spoiled"]
    temp_bin_rates[b] = round((sp / t) * 100, 1) if t > 0 else 0

# Storage Area impact
storage_stats = {"Yes": {"total": 0, "spoiled": 0}, "No": {"total": 0, "spoiled": 0}}
for r in raw_data:
    st = r["storage"]
    s = 1 if r["spoilage"] == "Yes" else 0
    storage_stats[st]["total"] += 1
    storage_stats[st]["spoiled"] += s

storage_rates = {
    "Yes": round((storage_stats["Yes"]["spoiled"] / storage_stats["Yes"]["total"]) * 100, 1),
    "No": round((storage_stats["No"]["spoiled"] / storage_stats["No"]["total"]) * 100, 1)
}

# Naive Bayes conditional frequencies for JS execution
# Let's count for Spoilage = Yes vs No
class_counts = {"Yes": 0, "No": 0}
feature_conds = {
    "Yes": {"crop": {}, "location": {}, "temp_bin": {}, "storage": {}},
    "No":  {"crop": {}, "location": {}, "temp_bin": {}, "storage": {}}
}

for r in raw_data:
    lbl = r["spoilage"]
    class_counts[lbl] += 1
    c = r["crop"]
    loc = r["location"]
    tb = "High" if r["temp"] > 30 else "Low"
    st = r["storage"]
    
    feature_conds[lbl]["crop"][c] = feature_conds[lbl]["crop"].get(c, 0) + 1
    feature_conds[lbl]["location"][loc] = feature_conds[lbl]["location"].get(loc, 0) + 1
    feature_conds[lbl]["temp_bin"][tb] = feature_conds[lbl]["temp_bin"].get(tb, 0) + 1
    feature_conds[lbl]["storage"][st] = feature_conds[lbl]["storage"].get(st, 0) + 1

# Append to stats.json
stats["spoilage_stats"] = {
    "rates_by_crop": spoilage_rates,
    "rates_by_temp": temp_bin_rates,
    "rates_by_storage": storage_rates,
    "class_counts": class_counts,
    "conditional_counts": feature_conds
}

with open('data/stats.json', 'w') as f:
    json.dump(stats, f, indent=2)

print("Spoilage data structured and statistics appended to stats.json!")
