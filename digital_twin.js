/**
 * KoolKisaan Storage Digital Twin & Economic Loss Simulator
 * Models physiological respiration, fungal moisture index, safe shelf-life decay,
 * and financial value-at-risk for agricultural storage facilities.
 */

class StorageDigitalTwin {
    constructor() {
        this.cropBaselines = {
            'Onion': {
                name: 'Onion (Rabi / Kharif)',
                optimalTempMin: 0,
                optimalTempMax: 2,
                ambientToleranceTemp: 25,
                optimalRHMin: 65,
                optimalRHMax: 70,
                maxShelfLifeDays: 120,
                defaultMandiPrice: 2800, // ₹ per quintal
                respirationFactor: 1.45,
                moistureSusceptibility: 0.85
            },
            'Tomato': {
                name: 'Tomato (Table / Processing)',
                optimalTempMin: 12,
                optimalTempMax: 15,
                ambientToleranceTemp: 20,
                optimalRHMin: 85,
                optimalRHMax: 90,
                maxShelfLifeDays: 21,
                defaultMandiPrice: 3200,
                respirationFactor: 1.90,
                moistureSusceptibility: 0.95
            },
            'Potato': {
                name: 'Potato (Cold Storage / Fresh)',
                optimalTempMin: 4,
                optimalTempMax: 8,
                ambientToleranceTemp: 20,
                optimalRHMin: 80,
                optimalRHMax: 85,
                maxShelfLifeDays: 180,
                defaultMandiPrice: 1600,
                respirationFactor: 1.15,
                moistureSusceptibility: 0.60
            },
            'Maize': {
                name: 'Maize / Corn (Grain)',
                optimalTempMin: 15,
                optimalTempMax: 25,
                ambientToleranceTemp: 30,
                optimalRHMin: 55,
                optimalRHMax: 65,
                maxShelfLifeDays: 240,
                defaultMandiPrice: 2100,
                respirationFactor: 0.70,
                moistureSusceptibility: 0.40
            },
            'Wheat': {
                name: 'Wheat (Durum / Sharbati)',
                optimalTempMin: 10,
                optimalTempMax: 20,
                ambientToleranceTemp: 28,
                optimalRHMin: 50,
                optimalRHMax: 60,
                maxShelfLifeDays: 365,
                defaultMandiPrice: 2450,
                respirationFactor: 0.50,
                moistureSusceptibility: 0.30
            }
        };
    }

    getCropBaseline(cropName) {
        return this.cropBaselines[cropName] || this.cropBaselines['Onion'];
    }

    /**
     * Compute comprehensive storage telemetry & risk forecast
     * @param {Object} params { crop, temp, humidity, ventilation, durationDays, packaging, lotSizeQuintals, customPrice }
     */
    simulate(params) {
        const {
            crop = 'Onion',
            temp = 32, // °C
            humidity = 75, // %
            ventilation = 'unventilated', // 'unventilated', 'natural', 'forced_cold'
            durationDays = 14,
            packaging = 'jute_bags', // 'jute_bags', 'plastic_crates', 'cold_ca', 'open_heap'
            lotSizeQuintals = 100,
            customPrice = null
        } = params;

        const baseline = this.getCropBaseline(crop);
        const mandiPrice = customPrice !== null && customPrice > 0 ? customPrice : baseline.defaultMandiPrice;

        // 1. Temperature Stress Factor
        let tempDelta = 0;
        if (temp > baseline.ambientToleranceTemp) {
            tempDelta = temp - baseline.ambientToleranceTemp;
        } else if (temp < baseline.optimalTempMin) {
            tempDelta = (baseline.optimalTempMin - temp) * 0.8; // Chilling injury
        }
        const tempScore = Math.min(1.0, Math.max(0.0, (tempDelta * 0.05) * baseline.respirationFactor));

        // 2. Humidity Stress Factor (Fungal Multiplication vs Dehydration)
        let rhDelta = 0;
        if (humidity > baseline.optimalRHMax) {
            rhDelta = humidity - baseline.optimalRHMax;
        } else if (humidity < baseline.optimalRHMin) {
            rhDelta = (baseline.optimalRHMin - humidity) * 0.4;
        }
        const rhScore = Math.min(1.0, Math.max(0.0, (rhDelta * 0.035) * baseline.moistureSusceptibility));

        // 3. Ventilation Factor
        let ventMultiplier = 1.0;
        if (ventilation === 'unventilated') {
            ventMultiplier = 1.45; // Trapped ethylene & humidity buildup
        } else if (ventilation === 'natural') {
            ventMultiplier = 1.0;
        } else if (ventilation === 'forced_cold') {
            ventMultiplier = 0.40; // Active airflow & temperature pull-down
        }

        // 4. Packaging Factor
        let packMultiplier = 1.0;
        if (packaging === 'open_heap') packMultiplier = 1.25;
        if (packaging === 'jute_bags') packMultiplier = 1.05;
        if (packaging === 'plastic_crates') packMultiplier = 0.85;
        if (packaging === 'cold_ca') packMultiplier = 0.35;

        // 5. Time Decay Factor
        const timeFraction = Math.min(2.0, durationDays / (baseline.maxShelfLifeDays * 0.4));

        // Combined Spoilage Probability
        const rawRisk = (tempScore * 0.45 + rhScore * 0.35) * ventMultiplier * packMultiplier * (0.6 + 0.4 * timeFraction);
        const spoilageProbability = Math.min(98.5, Math.max(2.0, Math.round(rawRisk * 100 * 10) / 10));

        // 6. Remaining Safe Shelf Life
        const decayRatePerDay = (spoilageProbability / 100) * 0.15 + (1 / baseline.maxShelfLifeDays);
        const estimatedShelfLifeDays = Math.max(1, Math.round((1 - (spoilageProbability / 100)) / decayRatePerDay));
        const estimatedShelfLifeHours = estimatedShelfLifeDays * 24;

        // 7. Economic Loss Calculations
        const totalLotValue = lotSizeQuintals * mandiPrice;
        const spoiledWeightQuintals = Math.round((lotSizeQuintals * (spoilageProbability / 100)) * 10) / 10;
        const financialLossINR = Math.round(spoiledWeightQuintals * mandiPrice);

        // Mitigation Potential (assuming upgrade to forced ventilation & crates)
        const mitigatedRisk = Math.max(3.0, spoilageProbability * 0.35);
        const mitigatedLossINR = Math.round((lotSizeQuintals * (mitigatedRisk / 100)) * mandiPrice);
        const potentialSavingsINR = Math.max(0, financialLossINR - mitigatedLossINR);

        // 8. Risk Badge & Severity Level
        let riskCategory = 'SAFE';
        let riskColor = '#16a34a';
        let riskBadgeClass = 'badge-success';

        if (spoilageProbability >= 60) {
            riskCategory = 'CRITICAL DECAY';
            riskColor = '#dc2626';
            riskBadgeClass = 'badge-danger';
        } else if (spoilageProbability >= 35) {
            riskCategory = 'MODERATE RISK';
            riskColor = '#d97706';
            riskBadgeClass = 'badge-warning';
        }

        // 9. Prescriptive Climate Action Recommendations
        const climateActions = [];
        if (temp > baseline.ambientToleranceTemp) {
            climateActions.push(`Deploy nighttime cross-ventilation or evaporative cooling pads to lower ambient temperature below ${baseline.ambientToleranceTemp}°C.`);
        }
        if (humidity > baseline.optimalRHMax) {
            climateActions.push(`High relative humidity (${humidity}%) exceeds threshold of ${baseline.optimalRHMax}%. Turn on exhaust blowers or place calcium chloride desiccant trays.`);
        }
        if (ventilation === 'unventilated') {
            climateActions.push('Unventilated storage traps volatile ethylene gas and accelerates rotten bulb clusters. Elevate storage pallets by at least 15 cm.');
        }
        if (packaging === 'open_heap') {
            climateActions.push('Avoid direct ground contact heaps. Switch to perforated plastic crates to improve inner stack air circulation by 40%.');
        }
        if (climateActions.length === 0) {
            climateActions.push('Storage parameters are within optimal preservation tolerances. Continue regular daily temperature logging.');
        }

        // 10. 30-Day Mandi Market Price Trend & Optimal Selling Window Optimization
        const priceMomenta = { 'Onion': 0.038, 'Tomato': -0.022, 'Potato': 0.018, 'Maize': 0.012, 'Wheat': 0.009 };
        const momentum = priceMomenta[crop] || 0.015;
        
        const projectedPrices = [
            { day: 'Day 3', price: Math.round(mandiPrice * (1 + momentum * 0.5)), trend: momentum >= 0 ? 'Bullish (+2.2%)' : 'Bearish (-1.1%)' },
            { day: 'Day 7', price: Math.round(mandiPrice * (1 + momentum * 1.1)), trend: momentum >= 0 ? 'Bullish (+4.2%)' : 'Bearish (-2.4%)' },
            { day: 'Day 14', price: Math.round(mandiPrice * (1 + momentum * 1.8)), trend: momentum >= 0 ? 'Bullish (+6.8%)' : 'Bearish (-3.9%)' },
            { day: 'Day 21', price: Math.round(mandiPrice * (1 + momentum * 2.5)), trend: momentum >= 0 ? 'Bullish (+9.5%)' : 'Bearish (-5.2%)' }
        ];

        let optimalSellingDay = Math.max(1, Math.min(estimatedShelfLifeDays - 2, 7));
        const sellingRecommendation = spoilageProbability >= 50
            ? `🚨 IMMEDIATE LIQUIDATION RECOMMENDED: Sell lot within 24-48 hours to avert ₹${financialLossINR.toLocaleString('en-IN')} rot loss.`
            : `📈 OPTIMAL SELLING WINDOW: Hold for ${optimalSellingDay}–${optimalSellingDay + 3} days. Projected Mandi peak rate: ₹${projectedPrices[1].price.toLocaleString('en-IN')}/Qtl.`;

        return {
            cropName: baseline.name,
            spoilageProbability,
            riskCategory,
            riskColor,
            riskBadgeClass,
            estimatedShelfLifeDays,
            estimatedShelfLifeHours,
            totalLotValue,
            spoiledWeightQuintals,
            financialLossINR,
            potentialSavingsINR,
            climateActions,
            lotSizeQuintals,
            mandiPrice,
            projectedPrices,
            optimalSellingDay,
            sellingRecommendation
        };
    }
}

// Global instance
window.agriDigitalTwin = new StorageDigitalTwin();
