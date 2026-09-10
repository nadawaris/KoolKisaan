/**
 * KoolKisaan Geo-Spatial GIS Map & Mandi Intelligence Engine
 * Provides interactive state-level query telemetry, pest alert heatmaps,
 * and live commodity price ticker.
 */

class AgriGeoEngine {
    constructor() {
        this.statesData = {
            'UP': {
                id: 'UP',
                name: 'Uttar Pradesh',
                capital: 'Lucknow',
                queryCount: 785,
                topCrops: ['Wheat', 'Paddy', 'Potato', 'Sugarcane'],
                topAlert: 'Yellow Rust Early Warning in Terai belt',
                topAlertSeverity: 'warning',
                storageRisk: 'Medium (38%)',
                mandiHub: 'Lucknow / Agra Mandi',
                coordinates: { cx: 480, cy: 260 }
            },
            'MH': {
                id: 'MH',
                name: 'Maharashtra',
                capital: 'Mumbai / Nashik',
                queryCount: 462,
                topCrops: ['Onion', 'Cotton', 'Soybean', 'Sugarcane'],
                topAlert: 'High Onion Spoilage alert in Nashik storage clusters (68%)',
                topAlertSeverity: 'danger',
                storageRisk: 'Critical (68%)',
                mandiHub: 'Lasalgaon / Vashi APMC',
                coordinates: { cx: 340, cy: 450 }
            },
            'KA': {
                id: 'KA',
                name: 'Karnataka',
                capital: 'Bengaluru / Hubli',
                queryCount: 318,
                topCrops: ['Maize', 'Tomato', 'Paddy', 'Sunflower'],
                topAlert: 'Tomato Mosaic Virus sporadic outbreaks in Kolar',
                topAlertSeverity: 'warning',
                storageRisk: 'Moderate (42%)',
                mandiHub: 'Hubli / Kolar APMC',
                coordinates: { cx: 320, cy: 580 }
            },
            'MP': {
                id: 'MP',
                name: 'Madhya Pradesh',
                capital: 'Bhopal / Indore',
                queryCount: 245,
                topCrops: ['Soybean', 'Wheat', 'Gram (Chana)', 'Garlic'],
                topAlert: 'Favorable harvest weather, dry storage recommended',
                topAlertSeverity: 'success',
                storageRisk: 'Low (22%)',
                mandiHub: 'Indore / Ujjain Mandi',
                coordinates: { cx: 400, cy: 360 }
            },
            'TS': {
                id: 'TS',
                name: 'Telangana',
                capital: 'Hyderabad',
                queryCount: 190,
                topCrops: ['Cotton', 'Paddy', 'Chili', 'Maize'],
                topAlert: 'Chili Thrips & Mites advisory active in Khammam',
                topAlertSeverity: 'warning',
                storageRisk: 'Moderate (35%)',
                mandiHub: 'Warangal / Bowenpally APMC',
                coordinates: { cx: 420, cy: 490 }
            },
            'PB': {
                id: 'PB',
                name: 'Punjab / Haryana',
                capital: 'Chandigarh / Khanna',
                queryCount: 165,
                topCrops: ['Wheat', 'Basmati Rice', 'Mustard', 'Cotton'],
                topAlert: 'Basmati Mandi arrivals surging with price firmness',
                topAlertSeverity: 'success',
                storageRisk: 'Low (18%)',
                mandiHub: 'Khanna Grain Market',
                coordinates: { cx: 330, cy: 190 }
            }
        };

        this.mandiTicker = [
            { commodity: 'Onion (Nashik)', mandi: 'Lasalgaon', price: '₹2,650/Qtl', change: '+4.2%', trend: 'up' },
            { commodity: 'Tomato (Hybrid)', mandi: 'Kolar', price: '₹3,100/Qtl', change: '-2.8%', trend: 'down' },
            { commodity: 'Basmati Rice (1121)', mandi: 'Khanna', price: '₹4,450/Qtl', change: '+1.5%', trend: 'up' },
            { commodity: 'Wheat (Sharbati)', mandi: 'Indore', price: '₹2,820/Qtl', change: '+0.5%', trend: 'up' },
            { commodity: 'Potato (Jyoti)', mandi: 'Agra', price: '₹1,450/Qtl', change: '-1.1%', trend: 'down' },
            { commodity: 'Maize (Yellow)', mandi: 'Hubli', price: '₹2,180/Qtl', change: '+3.0%', trend: 'up' },
            { commodity: 'Cotton (Medium)', mandi: 'Warangal', price: '₹7,200/Qtl', change: '+1.2%', trend: 'up' }
        ];
    }

    getState(stateId) {
        return this.statesData[stateId] || this.statesData['UP'];
    }

    renderMap(containerId, onSelectState) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let svgHtml = `
        <div class="geo-map-wrapper">
            <svg viewBox="0 0 800 700" class="agri-india-svg" id="agri-svg-map">
                <defs>
                    <radialGradient id="glow-danger" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#ef4444" stop-opacity="0.8"/>
                        <stop offset="100%" stop-color="#ef4444" stop-opacity="0"/>
                    </radialGradient>
                    <radialGradient id="glow-warning" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#f59e0b" stop-opacity="0.8"/>
                        <stop offset="100%" stop-color="#f59e0b" stop-opacity="0"/>
                    </radialGradient>
                    <radialGradient id="glow-success" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="#22c55e" stop-opacity="0.8"/>
                        <stop offset="100%" stop-color="#22c55e" stop-opacity="0"/>
                    </radialGradient>
                </defs>

                <!-- Base India Map Outline (Stylized Polygonal Boundary) -->
                <path class="map-boundary" d="
                    M 320,110 
                    L 370,120 L 410,160 L 460,190 L 530,220 L 620,240 L 720,250 L 750,290 L 700,320 
                    L 620,330 L 560,370 L 540,430 L 500,500 L 470,570 L 430,640 L 390,660 L 370,640 
                    L 330,590 L 290,520 L 270,430 L 220,350 L 220,290 L 260,220 L 280,160 Z" 
                    fill="#1b4332" stroke="#40916c" stroke-width="2.5" opacity="0.85" />

                <!-- Stylized State Regions -->
                <!-- Punjab / North -->
                <polygon points="280,160 360,150 370,220 300,230" class="state-polygon state-pb" data-id="PB" />
                
                <!-- Uttar Pradesh -->
                <polygon points="370,220 530,220 520,310 390,310" class="state-polygon state-up active" data-id="UP" />

                <!-- Madhya Pradesh -->
                <polygon points="340,310 520,310 490,410 320,400" class="state-polygon state-mp" data-id="MP" />

                <!-- Maharashtra -->
                <polygon points="260,390 410,400 390,500 280,490" class="state-polygon state-mh" data-id="MH" />

                <!-- Telangana -->
                <polygon points="400,430 490,420 470,520 390,510" class="state-polygon state-ts" data-id="TS" />

                <!-- Karnataka -->
                <polygon points="290,500 390,510 380,620 300,600" class="state-polygon state-ka" data-id="KA" />
        `;

        // Add interactive hotspot nodes with pulsing rings
        Object.values(this.statesData).forEach(state => {
            const { cx, cy } = state.coordinates;
            const glowId = state.topAlertSeverity === 'danger' ? 'glow-danger' : (state.topAlertSeverity === 'warning' ? 'glow-warning' : 'glow-success');
            const dotColor = state.topAlertSeverity === 'danger' ? '#ef4444' : (state.topAlertSeverity === 'warning' ? '#f59e0b' : '#22c55e');

            svgHtml += `
            <g class="state-node-group" data-id="${state.id}" style="cursor: pointer;">
                <circle cx="${cx}" cy="${cy}" r="32" fill="url(#${glowId})" class="pulse-glow" />
                <circle cx="${cx}" cy="${cy}" r="14" fill="#0f291e" stroke="${dotColor}" stroke-width="3" />
                <circle cx="${cx}" cy="${cy}" r="6" fill="${dotColor}" />
                <text x="${cx + 18}" y="${cy + 5}" fill="#ffffff" font-size="13" font-weight="700" font-family="'Outfit', sans-serif" class="map-label">${state.name} (${state.queryCount})</text>
            </g>
            `;
        });

        svgHtml += `
            </svg>
        </div>
        `;

        container.innerHTML = svgHtml;

        // Attach click handlers to all nodes & polygons
        const nodes = container.querySelectorAll('.state-node-group, .state-polygon');
        nodes.forEach(el => {
            el.addEventListener('click', () => {
                const stateId = el.getAttribute('data-id');
                if (stateId && onSelectState) {
                    onSelectState(this.getState(stateId));
                }
            });
        });
    }

    renderTicker(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        let tickerItems = this.mandiTicker.map(item => `
            <div class="mandi-ticker-item">
                <span class="mandi-crop"><i class="fa-solid fa-wheat-awn"></i> ${item.commodity}</span>
                <span class="mandi-name">@ ${item.mandi}</span>
                <span class="mandi-price">${item.price}</span>
                <span class="mandi-trend trend-${item.trend}">
                    <i class="fa-solid fa-arrow-trend-${item.trend}"></i> ${item.change}
                </span>
            </div>
        `).join('');

        container.innerHTML = `
            <div class="mandi-ticker-track">
                ${tickerItems}
                ${tickerItems} <!-- Duplicate for infinite marquee effect -->
            </div>
        `;
    }
}

// Global instance
window.agriGeoEngine = new AgriGeoEngine();
