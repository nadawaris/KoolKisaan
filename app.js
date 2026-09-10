/**
 * KoolKisaan Portal Controller
 * Manages task-specific views, toggles between datasets, Chart.js templates, Naive Bayes classifier, helpdesk FAQ,
 * and a full CRUD Data Management system with local disk synchronization.
 */

document.addEventListener('DOMContentLoaded', () => {
    // State management
    let queriesData = [];
    let spoilageData = [];
    let statsData = {};
    let activeCharts = {};
    let activeDatasetView = 'queries'; // 'queries' or 'spoilage'

    // CRUD State
    let crudActiveDataset = 'queries'; // 'queries' or 'spoilage'
    let crudCurrentPage = 1;
    let crudPageSize = 8;
    let crudSearchQuery = '';
    let editingRecordId = null; // null = Create, otherwise = ID of record being edited

    // 1. TAB SELECTION LOGIC
    const navItems = document.querySelectorAll('.nav-item:not(.logout-item)');
    const tabPanes = document.querySelectorAll('.tab-pane');
    const pageTitleText = document.getElementById('page-title-text');
    const currentTabName = document.getElementById('current-tab-name');

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            const targetTab = item.getAttribute('data-tab');
            
            if (targetTab === 'crud') {
                const role = sessionStorage.getItem('koolkisaan_role') || 'user';
                if (role !== 'admin') {
                    alert("Access denied. Only Administrators can manage datasets.");
                    return;
                }
            }
            
            // Toggle nav active state
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            // Toggle panes active state
            tabPanes.forEach(pane => pane.classList.remove('active'));
            const activePane = document.getElementById(`tab-${targetTab}`);
            activePane.classList.add('active');

            // Update page headers
            let title = '';
            let breadcrumbText = '';
            switch (targetTab) {
                case 'task1':
                    title = 'Task 1: Query Distribution and Analysis';
                    breadcrumbText = 'Task 1: Query Analysis';
                    setTimeout(() => renderCharts(), 50);
                    break;
                case 'task2':
                    title = 'Task 2: Query Intent Classification';
                    breadcrumbText = 'Task 2: Intent Classifier';
                    break;
                case 'task3':
                    title = 'Task 3: Similar Question Retrieval';
                    breadcrumbText = 'Task 3: Similar Retrieval';
                    break;
                case 'crop-doctor':
                    title = 'Task 4: AI Crop Doctor (Vision Diagnostics)';
                    breadcrumbText = 'Task 4: AI Crop Doctor';
                    if (window.renderActiveCropDoctor) window.renderActiveCropDoctor();
                    break;
                case 'digital-twin':
                    title = 'Task 5: Storage Digital Twin (Loss Forecaster)';
                    breadcrumbText = 'Task 5: Storage Digital Twin';
                    if (window.runDigitalTwinSim) window.runDigitalTwinSim();
                    break;
                case 'geo-map':
                    title = 'Task 6: Geo-Spatial GIS & Mandi APMC';
                    breadcrumbText = 'Task 6: GIS Map & Mandis';
                    if (window.renderAgriMap) window.renderAgriMap();
                    break;
                case 'crud':
                    title = 'Database Record Manager (CRUD)';
                    breadcrumbText = 'Database CRUD Manager';
                    setTimeout(() => renderCrudTable(), 50);
                    break;
            }
            pageTitleText.textContent = title;
            currentTabName.textContent = breadcrumbText;
        });
    });

    // 2. SUBVIEW DATASET TOGGLE (Task 1)
    const btnToggleQueries = document.getElementById('btn-toggle-queries');
    const btnToggleSpoilage = document.getElementById('btn-toggle-spoilage');
    const subviewQueries = document.getElementById('subview-queries');
    const subviewSpoilage = document.getElementById('subview-spoilage');

    btnToggleQueries.addEventListener('click', () => {
        btnToggleQueries.classList.add('active');
        btnToggleSpoilage.classList.remove('active');
        subviewQueries.classList.remove('hidden');
        subviewSpoilage.classList.add('hidden');
        activeDatasetView = 'queries';
        renderCharts();
    });

    btnToggleSpoilage.addEventListener('click', () => {
        btnToggleQueries.classList.remove('active');
        btnToggleSpoilage.classList.add('active');
        subviewQueries.classList.add('hidden');
        subviewSpoilage.classList.remove('hidden');
        activeDatasetView = 'spoilage';
        renderCharts();
    });

    // 3. FETCH DATA AND INITIALIZE
    function loadData() {
        try {
            // Load from precompiled global variables to ensure local offline operation
            queriesData = window.queriesData || [];
            spoilageData = window.spoilageData || [];
            statsData = window.statsData || {};
            
            // Initialize client-side AI retriever
            aiEngine.initialize(queriesData);
            
            // Populate metric card numbers
            populateKPIs();
            
            // Render initial charts
            renderCharts();
            
            // Initialize Pro Extensions (Voice AI, Crop Doctor, Digital Twin, Geo Map, Prescriptions)
            initProExtensions();
            
        } catch (error) {
            console.error("Error loading agricultural precompiled data:", error);
        }
    }

    function populateKPIs() {
        // Queries KPIs
        document.getElementById('kpi-queries').textContent = queriesData.length.toLocaleString();
        document.getElementById('kpi-crops').textContent = Object.keys(statsData.crops || {}).length;
        
        // Spoilage KPIs
        document.getElementById('kpi-spoil-total').textContent = spoilageData.length;
        const spoiledCount = spoilageData.filter(r => r.spoilage === 'Yes').length;
        const spoiledRate = spoilageData.length > 0 ? ((spoiledCount / spoilageData.length) * 100).toFixed(1) : "0.0";
        document.getElementById('kpi-spoil-rate').textContent = `${spoiledRate}%`;
        document.getElementById('kpi-fresh-rate').textContent = `${(100 - parseFloat(spoiledRate)).toFixed(1)}%`;
        
        // Find worst crop in current state
        if (statsData.spoilage_stats && statsData.spoilage_stats.rates_by_crop) {
            const worstCrop = Object.entries(statsData.spoilage_stats.rates_by_crop).sort((a,b) => b[1]-a[1])[0];
            if (worstCrop) {
                document.getElementById('kpi-worst-crop').textContent = worstCrop[0];
                document.getElementById('kpi-worst-rate').textContent = `${worstCrop[1]}% Spoilage Rate`;
            } else {
                document.getElementById('kpi-worst-crop').textContent = 'N/A';
                document.getElementById('kpi-worst-rate').textContent = '0.0% Spoilage Rate';
            }
        } else {
            document.getElementById('kpi-worst-crop').textContent = 'N/A';
            document.getElementById('kpi-worst-rate').textContent = '0.0% Spoilage Rate';
        }
    }

    // 4. CHART.JS VISUALISATIONS (Task 1 & Spoilage)
    function renderCharts() {
        // Destroy existing charts to reload clean canvas
        Object.keys(activeCharts).forEach(key => {
            activeCharts[key].destroy();
        });
        activeCharts = {};

        if (activeDatasetView === 'queries') {
            // --- Chart 1: Intent Doughnut ---
            const intentCtx = document.getElementById('chart-intent').getContext('2d');
            const intentKeys = Object.keys(statsData.query_types || {});
            const intentVals = Object.values(statsData.query_types || {});
            
            activeCharts['intent'] = new Chart(intentCtx, {
                type: 'doughnut',
                data: {
                    labels: intentKeys,
                    datasets: [{
                        data: intentVals,
                        backgroundColor: [
                            '#1b4332', '#2d6a4f', '#40916c', '#52b788', '#74c69d', '#95d5b2'
                        ],
                        borderColor: '#ffffff',
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'right',
                            labels: { boxWidth: 12, font: { family: 'Outfit', size: 11 } }
                        }
                    }
                }
            });

            // --- Chart 2: States Bar Chart ---
            const stateCtx = document.getElementById('chart-state').getContext('2d');
            const stateKeys = Object.keys(statsData.states || {});
            const stateVals = Object.values(statsData.states || {});

            activeCharts['state'] = new Chart(stateCtx, {
                type: 'bar',
                data: {
                    labels: stateKeys.map(s => s.replace(' ', '\n')),
                    datasets: [{
                        label: 'Query Count',
                        data: stateVals,
                        backgroundColor: '#40916c',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#f0f4f2' } },
                        x: { grid: { display: false } }
                    }
                }
            });

            // --- Chart 3: Top Crops Horizontal Bar ---
            const cropCtx = document.getElementById('chart-crop').getContext('2d');
            const sortedCrops = Object.entries(statsData.crops || {})
                .filter(([k, _]) => k !== 'Other Crops')
                .sort((a, b) => b[1] - a[1])
                .slice(0, 8);
            
            const cropLabels = sortedCrops.map(item => item[0]);
            const cropVals = sortedCrops.map(item => item[1]);

            activeCharts['crop'] = new Chart(cropCtx, {
                type: 'bar',
                indexAxis: 'y',
                data: {
                    labels: cropLabels,
                    datasets: [{
                        label: 'Queries',
                        data: cropVals,
                        backgroundColor: '#52b788',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        x: { beginAtZero: true, grid: { color: '#f0f4f2' } },
                        y: { grid: { display: false } }
                    }
                }
            });

            // --- Chart 4: Monthly line chart (Seasonal Trends) ---
            const monthCtx = document.getElementById('chart-month').getContext('2d');
            const monthMap = { "1": "January", "2": "February", "3": "March" };
            const monthLabels = Object.keys(statsData.months || {}).map(m => monthMap[m] || `Month ${m}`);
            const monthVals = Object.values(statsData.months || {});

            activeCharts['month'] = new Chart(monthCtx, {
                type: 'line',
                data: {
                    labels: monthLabels,
                    datasets: [{
                        label: 'Queries Received',
                        data: monthVals,
                        borderColor: '#2d6a4f',
                        backgroundColor: 'rgba(82, 183, 136, 0.15)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 3,
                        pointBackgroundColor: '#1b4332'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, grid: { color: '#f0f4f2' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        } else {
            // RENDER SPOILAGE DATASET CHARTS
            const spStats = statsData.spoilage_stats || {};
            const rates_by_crop = spStats.rates_by_crop || {};
            const rates_by_temp = spStats.rates_by_temp || {};
            const rates_by_storage = spStats.rates_by_storage || {};

            // --- Spoilage Crop Bar Chart ---
            const spoilCropCtx = document.getElementById('chart-spoil-crop').getContext('2d');
            const sortedCrops = Object.entries(rates_by_crop).sort((a,b) => b[1]-a[1]);
            activeCharts['spoil_crop'] = new Chart(spoilCropCtx, {
                type: 'bar',
                data: {
                    labels: sortedCrops.map(c => c[0]),
                    datasets: [{
                        label: 'Spoilage Rate (%)',
                        data: sortedCrops.map(c => c[1]),
                        backgroundColor: sortedCrops.map(c => c[1] > 60 ? '#c53030' : '#40916c'),
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, max: 100, grid: { color: '#f0f4f2' } },
                        x: { grid: { display: false } }
                    }
                }
            });

            // --- Spoilage Temp range Bar Chart ---
            const spoilTempCtx = document.getElementById('chart-spoil-temp').getContext('2d');
            const sortedTemps = Object.entries(rates_by_temp);
            activeCharts['spoil_temp'] = new Chart(spoilTempCtx, {
                type: 'bar',
                data: {
                    labels: sortedTemps.map(c => c[0]),
                    datasets: [{
                        label: 'Spoilage Rate (%)',
                        data: sortedTemps.map(c => c[1]),
                        backgroundColor: '#52b788',
                        borderRadius: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, max: 100, grid: { color: '#f0f4f2' } },
                        x: { grid: { display: false } }
                    }
                }
            });

            // --- Spoilage Storage Area impact Doughnut/Bar ---
            const spoilStoreCtx = document.getElementById('chart-spoil-storage').getContext('2d');
            const sortedStore = Object.entries(rates_by_storage);
            activeCharts['spoil_store'] = new Chart(spoilStoreCtx, {
                type: 'bar',
                data: {
                    labels: ['Stored inside closed Storage Area (Yes)', 'Stored in Open-air heaps (No)'],
                    datasets: [{
                        label: 'Spoilage Rate (%)',
                        data: sortedStore.map(c => c[1]),
                        backgroundColor: ['#c53030', '#2d6a4f'],
                        borderRadius: 4,
                        barThickness: 45
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                        y: { beginAtZero: true, max: 100, grid: { color: '#f0f4f2' } },
                        x: { grid: { display: false } }
                    }
                }
            });
        }
    }

    // 5. TASK 2: INTENT CLASSIFIER
    const btnClassify = document.getElementById('btn-classify');
    const classifierInput = document.getElementById('classifier-input');
    const classifierResult = document.getElementById('classifier-result');
    const classPredictedName = document.getElementById('class-predicted-name');
    const classConfidenceFill = document.getElementById('class-confidence-fill');
    const classConfidenceVal = document.getElementById('class-confidence-val');
    const classKeywords = document.getElementById('class-keywords');

    btnClassify.addEventListener('click', () => {
        const text = classifierInput.value.trim();
        if (!text) return;

        const result = aiEngine.classify(text);

        // Populate fields
        classPredictedName.textContent = result.category;
        classConfidenceFill.style.width = `${result.confidence}%`;
        classConfidenceVal.textContent = `${result.confidence}%`;

        // Render matching keywords
        classKeywords.innerHTML = '';
        if (result.matchingTerms.length > 0) {
            result.matchingTerms.forEach(word => {
                const span = document.createElement('span');
                span.textContent = word;
                classKeywords.appendChild(span);
            });
        } else {
            const span = document.createElement('span');
            span.textContent = 'None';
            span.style.background = '#edf2f7';
            span.style.color = '#718096';
            classKeywords.appendChild(span);
        }

        // Show result panel
        classifierResult.classList.remove('hidden');
    });

    // Example tag click listener
    document.querySelectorAll('.example-tag').forEach(tag => {
        tag.addEventListener('click', () => {
            classifierInput.value = tag.getAttribute('data-text');
            btnClassify.click();
        });
    });

    // Ambiguity Card click listener
    document.querySelectorAll('.ambiguous-card').forEach(card => {
        card.addEventListener('click', () => {
            const query = card.getAttribute('data-query');
            classifierInput.value = query;
            btnClassify.click();
            classifierInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    // 6. CROP SPOILAGE RISK PREDICTOR (Naive Bayes Classifier)
    const selectSpoilCrop = document.getElementById('spoil-crop');
    const selectSpoilLoc = document.getElementById('spoil-loc');
    const sliderSpoilTemp = document.getElementById('spoil-temp');
    const displaySpoilTemp = document.getElementById('val-spoil-temp');
    const selectSpoilStore = document.getElementById('spoil-store');
    const btnPredictSpoil = document.getElementById('btn-predict-spoil');

    const spoilResultArea = document.getElementById('spoil-result-area');
    const spoilGaugeFill = document.getElementById('spoil-gauge-fill');
    const spoilGaugeText = document.getElementById('spoil-gauge-text');
    const spoilRiskBadge = document.getElementById('spoil-risk-badge');
    const spoilAdviceText = document.getElementById('spoil-advice-text');

    sliderSpoilTemp.addEventListener('input', () => {
        displaySpoilTemp.textContent = sliderSpoilTemp.value;
    });

    btnPredictSpoil.addEventListener('click', () => {
        const crop = selectSpoilCrop.value;
        const loc = selectSpoilLoc.value;
        const temp = parseInt(sliderSpoilTemp.value);
        const store = selectSpoilStore.value;
        const temp_bin = temp > 30 ? "High" : "Low";

        if (!statsData.spoilage_stats || !statsData.spoilage_stats.class_counts) return;

        const sp = statsData.spoilage_stats;
        
        // Prior probabilities
        const spoil_count = sp.class_counts.Yes || 0;
        const fresh_count = sp.class_counts.No || 0;
        const total_count = spoil_count + fresh_count;
        
        if (total_count === 0) {
            alert("No crop spoilage records found. Please add some records in the Database Record Manager (CRUD) tab first!");
            return;
        }
        
        const p_spoil = spoil_count / total_count;
        const p_fresh = fresh_count / total_count;

        const conds = sp.conditional_counts;

        // Conditional probabilities with Laplace smoothing
        const get_cond_prob = (lbl, feature, val, vocab_size) => {
            const matches = conds[lbl][feature][val] || 0;
            const total_lbl = lbl === "Yes" ? spoil_count : fresh_count;
            return (matches + 1) / (total_lbl + vocab_size);
        };

        const p_crop_spoil = get_cond_prob("Yes", "crop", crop, 5);
        const p_loc_spoil = get_cond_prob("Yes", "location", loc, 3);
        const p_temp_spoil = get_cond_prob("Yes", "temp_bin", temp_bin, 2);
        const p_store_spoil = get_cond_prob("Yes", "storage", store, 2);
        const score_spoil = p_spoil * p_crop_spoil * p_loc_spoil * p_temp_spoil * p_store_spoil;

        const p_crop_fresh = get_cond_prob("No", "crop", crop, 5);
        const p_loc_fresh = get_cond_prob("No", "location", loc, 3);
        const p_temp_fresh = get_cond_prob("No", "temp_bin", temp_bin, 2);
        const p_store_fresh = get_cond_prob("No", "storage", store, 2);
        const score_fresh = p_fresh * p_crop_fresh * p_loc_fresh * p_temp_fresh * p_store_fresh;

        const prob_spoil = score_spoil / (score_spoil + score_fresh);
        const finalPercentage = Math.round(prob_spoil * 100);

        // Update displays
        spoilGaugeFill.style.width = `${finalPercentage}%`;
        spoilGaugeText.textContent = `${finalPercentage}%`;

        // Reset badge styles
        spoilRiskBadge.className = 'risk-badge';
        let outcome = '';
        let advice = '';

        if (finalPercentage < 45) {
            spoilRiskBadge.textContent = 'LOW RISK';
            spoilRiskBadge.classList.add('risk-safe');
            spoilGaugeFill.style.background = 'var(--primary)';
            outcome = 'Fresh (Low rot risk)';
            advice = `Storage conditions are stable. **${crop}** has low spoilage affinity in these parameters. Monitor weekly.`;
        } else if (finalPercentage < 65) {
            spoilRiskBadge.textContent = 'MODERATE RISK';
            spoilRiskBadge.classList.add('risk-warning');
            spoilGaugeFill.style.background = '#d97706'; // orange
            outcome = 'Moderate threat of decay';
            advice = `Warning: **${crop}** in ${loc} at ${temp}°C shows moderate respiration decay threat. Recommend reducing temperature or improving air circulation.`;
        } else {
            spoilRiskBadge.textContent = 'CRITICAL RISK';
            spoilRiskBadge.classList.add('risk-severe');
            spoilGaugeFill.style.background = 'var(--error)';
            outcome = 'Spoiled (High rot risk)';
            advice = `<strong style='color:var(--error);'>ACTION REQUIRED:</strong> Critical post-harvest risk. Closed storage or high temperatures (${temp}°C) accelerates decay in **${crop}**. Move to ventilated crates, ensure humidity is below 65%, and cool below 25°C immediately.`;
        }

        spoilAdviceText.innerHTML = `<strong>Predicted Outcome:</strong> ${outcome}.<br><br>${advice}`;
        spoilResultArea.classList.remove('hidden');
    });

    // 7. TASK 3: SIMILAR QUESTION RETRIEVAL & HELPDESK FAQ GENERATOR
    const btnSearch = document.getElementById('btn-search');
    const retrieverInput = document.getElementById('retriever-input');
    const retrieverResultsArea = document.getElementById('retriever-results-area');

    const faqEmptyState = document.getElementById('faq-empty-state');
    const faqDraftContainer = document.getElementById('faq-draft-container');
    const draftCropCat = document.getElementById('draft-crop-cat');
    const faqResponseText = document.getElementById('faq-response-text');
    const btnCopyDraft = document.getElementById('btn-copy-draft');
    const copyStatus = document.getElementById('copy-status');
    const diagnosisText = document.getElementById('diagnosis-text');

    // FAQ Templates by category
    const FAQ_TEMPLATES = {
        'Market Rates & Info': {
            template: "Dear Farmer, regarding the current market rates for [Crop], the wholesale prices in regional APMC markets (Latur, Akola, Lucknow) are trading between Rs. [Price-Min] and Rs. [Price-Max] per quintal. Prices are steady but expected to fluctuate based on seasonal arrivals. We recommend verifying rates with your local market yard or the official Agmarknet portal before organizing transport.",
            rationale: "Compiled using crop category [Crop] matched against historical [Category] queries. Outlines local APMC rates and advises digital Agmarknet validation to prevent broker exploitation."
        },
        'Plant Protection': {
            template: "Dear Farmer, for protecting [Crop] against common diseases and blight attacks, we advise the following: 1. Ensure proper farm sanitation and remove infected leaves. 2. For early pest protection, spray Neem Seed Kernel Extract (NSKE) 5% or neem oil @ 5ml/liter. 3. For severe outbreaks, apply recommended chemical sprays such as Mancozeb @ 2.5g/L or Copper Oxychloride @ 3.0g/L. Please consult your local extension worker to inspect severity before spraying.",
            rationale: "Foliage protection and chemical dosage advice created from [Crop] crop context and [Category] database records."
        },
        'Nutrient Management': {
            template: "Dear Farmer, for optimal crop growth and flowering in [Crop], a balanced nutritional application is key. We recommend applying well-decomposed Farm Yard Manure (FYM) or compost during field preparation. Based on soil testing, implement nitrogenous fertilizers in split doses (at vegetative and pre-flowering stages). If you observe leaf yellowing, spray Micronutrient mixture @ 2g/liter of water during cool evening hours.",
            rationale: "Soil nutrition, organic composting, and split dose schedules customized for [Crop] based on historical [Category] queries."
        },
        'Government Schemes': {
            template: "Dear Farmer, for [Crop] growers, there are currently direct government subsidies available under the National Agriculture Development Program. Subsidies ranging from 50% to 90% are offered for drip/sprinkler irrigation installations, plastic mulching sheets, and custom farm machinery. We advise visiting your block extension office with your Farmer ID, Land Holding record, and Aadhaar card to submit your application.",
            rationale: "Welfare subsidies and registration procedures drafted for [Crop] using [Category] keywords."
        },
        'Weather': {
            template: "Dear Farmer, current weather advisory signals indicate moderate humidity and potential light rains in your block over the next 48-72 hours. For your [Crop] crop, we recommend: 1. Postpone any planned pesticide sprayings or fertilizer top-dressings. 2. Ensure clear drainage channels to avoid waterlogging in low-lying crop beds. 3. Delay harvesting if crops are mature until fields dry.",
            rationale: "Advisory adjustment based on weather-crop intersection parameters mapped to [Crop] and [Category]."
        },
        'Seeds': {
            template: "Dear Farmer, for [Crop] sowing, it is critical to use certified seeds from verified seed stores to guarantee a high germination rate (above 75%). Suitable high-yielding varieties for this season include [Var-A] and [Var-B]. We strongly advise performing seed treatment with Trichoderma viride @ 4g/kg seed or Thiram @ 3g/kg seed to prevent seed-borne fungal infections and root rot.",
            rationale: "Seed sourcing, certified varieties ([Var-A]/[Var-B]), and biological seed treatment recommendations derived from [Category]."
        }
    };

    // Crop details database for placeholders
    const CROP_DETAILS = {
        'Onion': { priceMin: "1,400", priceMax: "1,950", varA: "Bhima Kiran", varB: "Agri Found Light Red" },
        'Citrus': { priceMin: "3,500", priceMax: "4,800", varA: "Phule Shahi", varB: "Nagpur Mandarin" },
        'Paddy/Rice': { priceMin: "1,850", priceMax: "2,300", varA: "Jaya", varB: "IR-64" },
        'Wheat': { priceMin: "2,100", priceMax: "2,550", varA: "GW-322", varB: "Lok-1" },
        'Cotton': { priceMin: "6,200", priceMax: "7,500", varA: "Rajat", varB: "Ajit-155 (Bt)" },
        'Orange': { priceMin: "3,800", priceMax: "5,000", varA: "Nagpur Mandarin", varB: "Coorg Orange" },
        'Turmeric': { priceMin: "5,500", priceMax: "7,200", varA: "Selam", varB: "Prathiba" },
        'Bengal Gram': { priceMin: "4,800", priceMax: "5,400", varA: "Vijay", varB: "Digvijay" },
        'Green Gram': { priceMin: "6,500", priceMax: "7,800", varA: "Kopergaon", varB: "BPMR-145" },
        'Black Gram': { priceMin: "6,000", priceMax: "7,450", varA: "TAU-1", varB: "T-9" },
        'Pigeon Pea (Tur)': { priceMin: "5,800", priceMax: "7,100", varA: "Vipula", varB: "BDN-711" },
        'Watermelon': { priceMin: "800", priceMax: "1,400", varA: "Sugar Baby", varB: "Arka Manik" },
        'Sesame': { priceMin: "9,000", priceMax: "11,500", varA: "AKT-64", varB: "Phule Til-1" }
    };

    function generateFAQDraft(crop, category) {
        const catObj = FAQ_TEMPLATES[category] || FAQ_TEMPLATES['Market Rates & Info'];
        const cropObj = CROP_DETAILS[crop] || { priceMin: "1,500", priceMax: "2,500", varA: "Local Certified A", varB: "Local Certified B" };

        let draft = catObj.template;
        draft = draft.replace(/\[Crop\]/g, crop);
        draft = draft.replace(/\[Category\]/g, category);
        draft = draft.replace(/\[Price-Min\]/g, cropObj.priceMin);
        draft = draft.replace(/\[Price-Max\]/g, cropObj.priceMax);
        draft = draft.replace(/\[Var-A\]/g, cropObj.varA);
        draft = draft.replace(/\[Var-B\]/g, cropObj.varB);

        faqResponseText.value = draft;
        draftCropCat.innerHTML = `Crop: <strong>${crop}</strong> &bull; Intent Category: <strong>${category}</strong>`;

        // Display draft panel
        faqEmptyState.classList.add('hidden');
        faqDraftContainer.classList.remove('hidden');
    }

    // Dynamic Semantic Adaptability Diagnosis
    function generateDiagnosis(queryText, topMatch) {
        const rawTokens = queryText.toLowerCase().replace(/[^\w\s-]/g, ' ').split(/\s+/).map(w => w.trim());
        const corrections = [];
        
        rawTokens.forEach(tok => {
            if (aiEngine.synonyms[tok]) {
                corrections.push(`"${tok}" &rarr; <strong>"${aiEngine.synonyms[tok]}"</strong>`);
            }
        });

        let typoHtml = '';
        if (corrections.length > 0) {
            typoHtml = `<span style="color:#b7791f;"><i class="fa-solid fa-magic"></i> <strong>Typo Tolerance Active:</strong> Mapped variances: ${corrections.join(', ')}. This aligned phonetic splits to index tokens.</span>`;
        } else {
            typoHtml = `<span style="color:var(--primary);"><i class="fa-solid fa-check-double"></i> <strong>Standard Vocabulary:</strong> Term maps matched index dictionary without spelling normalization.</span>`;
        }

        const vectorHtml = `<span><i class="fa-solid fa-compass"></i> <strong>Vector Routing:</strong> Query mapped to the <strong>${topMatch.query.query_type}</strong> centroid (Cosine Sim: ${Math.round(topMatch.score*100)}%). Crop vector: <strong>${topMatch.query.crop_extracted}</strong>. Drafted context-specific advisory template.</span>`;

        diagnosisText.innerHTML = `${typoHtml}<br><br>${vectorHtml}`;
    }

    function executeSearch() {
        const text = retrieverInput.value.trim();
        if (!text) return;

        const results = aiEngine.retrieve(text, 5);

        retrieverResultsArea.innerHTML = '';

        if (results.length === 0) {
            retrieverResultsArea.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-face-frown"></i>
                    <p>No matching historical queries found. Try broadening your terms.</p>
                </div>
            `;
            faqDraftContainer.classList.add('hidden');
            faqEmptyState.classList.remove('hidden');
            return;
        }

        const tokens = aiEngine.tokenize(text);
        
        results.forEach((res, index) => {
            const card = document.createElement('div');
            card.className = 'retrieved-card';
            card.dataset.index = res.index;
            card.dataset.crop = res.query.crop_extracted;
            card.dataset.category = res.query.query_type;

            // Highlight words
            let queryTextHtml = res.query.query_text;
            tokens.forEach(tok => {
                if (tok.length > 2) {
                    const regex = new RegExp(`\\b(${tok})\\b`, 'gi');
                    queryTextHtml = queryTextHtml.replace(regex, '<span class="highlight">$1</span>');
                }
            });

            const scorePercent = Math.round(res.score * 100);

            card.innerHTML = `
                <div class="retrieved-header">
                    <div class="meta-tags">
                        <span class="meta-tag meta-tag-crop">${res.query.crop_extracted}</span>
                        <span class="meta-tag">${res.query.query_type}</span>
                    </div>
                    <span class="match-score">Match: ${scorePercent}%</span>
                </div>
                <p class="retrieved-text">"${queryTextHtml}"</p>
                <div class="retrieved-location">
                    <i class="fa-solid fa-location-dot"></i>
                    <span>${res.query.state} &bull; ${res.query.district} &bull; ${res.query.block} Block</span>
                </div>
            `;

            // Click listener for selecting retrieved cards
            card.addEventListener('click', () => {
                document.querySelectorAll('.retrieved-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                generateFAQDraft(res.query.crop_extracted, res.query.query_type);
                generateDiagnosis(text, res);
            });

            retrieverResultsArea.appendChild(card);
            
            // Auto-select the first match on load
            if (index === 0) {
                card.classList.add('selected');
                generateFAQDraft(res.query.crop_extracted, res.query.query_type);
                generateDiagnosis(text, res);
            }
        });
    }

    btnSearch.addEventListener('click', executeSearch);
    retrieverInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            executeSearch();
        }
    });

    // Farmer Profile Scenario clicks
    document.querySelectorAll('.scenario-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const query = btn.getAttribute('data-query');
            retrieverInput.value = query;
            executeSearch();
            
            // Scroll search container into view
            retrieverInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
    });

    // Copy draft to clipboard
    btnCopyDraft.addEventListener('click', () => {
        const textToCopy = faqResponseText.value;
        navigator.clipboard.writeText(textToCopy).then(() => {
            copyStatus.classList.remove('hidden');
            setTimeout(() => {
                copyStatus.classList.add('hidden');
            }, 2000);
        }).catch(err => {
            console.error('Could not copy advisory response text: ', err);
        });
    });


    // ==========================================
    // 8. CRUD DATA MANAGEMENT LOGIC
    // ==========================================
    const btnCrudQueries = document.getElementById('btn-crud-toggle-queries');
    const btnCrudSpoilage = document.getElementById('btn-crud-toggle-spoilage');
    const crudSearchInput = document.getElementById('crud-search');
    const btnSyncDisk = document.getElementById('btn-sync-disk');
    const syncStatus = document.getElementById('sync-status');
    
    const crudTableHeaders = document.getElementById('crud-table-headers');
    const crudTableBody = document.getElementById('crud-table-body');
    const crudPageInfo = document.getElementById('crud-page-info');
    const btnPrevPage = document.getElementById('btn-prev-page');
    const btnNextPage = document.getElementById('btn-next-page');
    
    const btnAddRecord = document.getElementById('btn-add-record');
    const crudModal = document.getElementById('crud-modal');
    const btnCloseModal = document.getElementById('btn-close-modal');
    const btnCancelModal = document.getElementById('btn-cancel-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalFieldsContainer = document.getElementById('modal-fields-container');
    const crudForm = document.getElementById('crud-form');

    // Toggles between datasets
    btnCrudQueries.addEventListener('click', () => {
        btnCrudQueries.classList.add('active');
        btnCrudSpoilage.classList.remove('active');
        crudActiveDataset = 'queries';
        crudCurrentPage = 1;
        renderCrudTable();
    });

    btnCrudSpoilage.addEventListener('click', () => {
        btnCrudQueries.classList.remove('active');
        btnCrudSpoilage.classList.add('active');
        crudActiveDataset = 'spoilage';
        crudCurrentPage = 1;
        renderCrudTable();
    });

    // Search filter listener
    crudSearchInput.addEventListener('input', () => {
        crudSearchQuery = crudSearchInput.value.toLowerCase().trim();
        crudCurrentPage = 1;
        renderCrudTable();
    });

    // Pagination Listeners
    btnPrevPage.addEventListener('click', () => {
        if (crudCurrentPage > 1) {
            crudCurrentPage--;
            renderCrudTable();
        }
    });

    btnNextPage.addEventListener('click', () => {
        const total = getFilteredDataset().length;
        const maxPage = Math.ceil(total / crudPageSize);
        if (crudCurrentPage < maxPage) {
            crudCurrentPage++;
            renderCrudTable();
        }
    });

    function getFilteredDataset() {
        const data = crudActiveDataset === 'queries' ? queriesData : spoilageData;
        if (!crudSearchQuery) return data;
        
        return data.filter(item => {
            if (crudActiveDataset === 'queries') {
                return (item.query_text.toLowerCase().includes(crudSearchQuery) || 
                        item.crop_extracted.toLowerCase().includes(crudSearchQuery) ||
                        item.query_type.toLowerCase().includes(crudSearchQuery) ||
                        item.state.toLowerCase().includes(crudSearchQuery));
            } else {
                return (item.crop.toLowerCase().includes(crudSearchQuery) ||
                        item.location.toLowerCase().includes(crudSearchQuery) ||
                        item.temp.toString().includes(crudSearchQuery) ||
                        item.spoilage.toLowerCase().includes(crudSearchQuery));
            }
        });
    }

    function renderCrudTable() {
        const filtered = getFilteredDataset();
        const total = filtered.length;
        const maxPage = Math.ceil(total / crudPageSize) || 1;
        
        // Boundaries
        if (crudCurrentPage > maxPage) crudCurrentPage = maxPage;
        const start = (crudCurrentPage - 1) * crudPageSize;
        const end = Math.min(start + crudPageSize, total);
        const paginated = filtered.slice(start, end);

        // Role checking
        const role = sessionStorage.getItem('koolkisaan_role') || 'user';
        const isAdmin = role === 'admin';

        // Render headers
        crudTableHeaders.innerHTML = '';
        if (crudActiveDataset === 'queries') {
            crudTableHeaders.innerHTML = `
                <th>ID</th>
                <th>Query Text</th>
                <th>Crop Focus</th>
                <th>Category (Intent)</th>
                <th>State</th>
                ${isAdmin ? '<th>Actions</th>' : ''}
            `;
        } else {
            crudTableHeaders.innerHTML = `
                <th>Record ID</th>
                <th>Crop Type</th>
                <th>Temperature (°C)</th>
                <th>Spoiled?</th>
                <th>Storage Area</th>
                <th>Location</th>
                ${isAdmin ? '<th>Actions</th>' : ''}
            `;
        }

        // Render rows
        crudTableBody.innerHTML = '';
        if (paginated.length === 0) {
            const cols = crudActiveDataset === 'queries' ? (isAdmin ? 6 : 5) : (isAdmin ? 7 : 6);
            crudTableBody.innerHTML = `
                <tr>
                    <td colspan="${cols}" style="text-align: center; color: var(--text-light); padding: 2rem;">No matching records found.</td>
                </tr>
            `;
            crudPageInfo.textContent = `Showing 0 to 0 of 0 entries`;
            return;
        }

        paginated.forEach(row => {
            const tr = document.createElement('tr');
            if (crudActiveDataset === 'queries') {
                // Find index of row in queriesData
                const id = queriesData.indexOf(row);
                tr.innerHTML = `
                    <td><strong>#${id}</strong></td>
                    <td style="max-width: 280px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">"${row.query_text}"</td>
                    <td><span class="meta-tag meta-tag-crop">${row.crop_extracted}</span></td>
                    <td><span class="meta-tag">${row.query_type}</span></td>
                    <td>${row.state}</td>
                    ${isAdmin ? `
                    <td>
                        <div class="crud-actions">
                            <button class="btn-icon btn-icon-edit" onclick="window.triggerEditRecord('queries', ${id})"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-icon btn-icon-delete" onclick="window.triggerDeleteRecord('queries', ${id})"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>` : ''}
                `;
            } else {
                const id = row.record_id;
                tr.innerHTML = `
                    <td><strong>#${id}</strong></td>
                    <td><span class="meta-tag meta-tag-crop">${row.crop}</span></td>
                    <td>${row.temp}°C</td>
                    <td><span class="badge ${row.spoilage === 'Yes' ? 'badge-danger' : 'badge-success'}" style="padding: 2px 8px; font-size: 0.75rem;">${row.spoilage}</span></td>
                    <td>${row.storage === 'Yes' ? 'Yes (Closed)' : 'No (Open)'}</td>
                    <td>${row.location}</td>
                    ${isAdmin ? `
                    <td>
                        <div class="crud-actions">
                            <button class="btn-icon btn-icon-edit" onclick="window.triggerEditRecord('spoilage', ${id})"><i class="fa-solid fa-pen"></i></button>
                            <button class="btn-icon btn-icon-delete" onclick="window.triggerDeleteRecord('spoilage', ${id})"><i class="fa-solid fa-trash"></i></button>
                        </div>
                    </td>` : ''}
                `;
            }
            crudTableBody.appendChild(tr);
        });

        // Update page info
        crudPageInfo.textContent = `Showing ${total === 0 ? 0 : start + 1} to ${end} of ${total} entries`;
        
        // Disabled classes
        btnPrevPage.disabled = crudCurrentPage === 1;
        btnNextPage.disabled = crudCurrentPage === maxPage;
    }

    // Modal management
    btnAddRecord.addEventListener('click', () => openModal(null));
    btnCloseModal.addEventListener('click', closeModal);
    btnCancelModal.addEventListener('click', closeModal);

    function openModal(record = null) {
        editingRecordId = record ? (crudActiveDataset === 'queries' ? queriesData.indexOf(record) : record.record_id) : null;
        modalTitle.innerHTML = editingRecordId !== null ? `<i class="fa-solid fa-pen-to-square"></i> Edit Record` : `<i class="fa-solid fa-plus-circle"></i> Add New Record`;
        
        modalFieldsContainer.innerHTML = '';
        
        if (crudActiveDataset === 'queries') {
            const qText = record ? record.query_text : '';
            const qCrop = record ? record.crop_extracted : 'Other Crops';
            const qType = record ? record.query_type : 'Market Rates & Info';
            const qState = record ? record.state : 'UTTAR PRADESH';
            
            modalFieldsContainer.innerHTML = `
                <div class="control-group">
                    <label for="form-qtext">Query Text</label>
                    <textarea id="form-qtext" required rows="3" style="width:100%; padding:0.5rem; border:1px solid var(--border-color); border-radius:4px; font-family:var(--font-sans); resize:none;">${qText}</textarea>
                </div>
                <div class="control-group">
                    <label for="form-qcrop">Crop Extracted</label>
                    <input type="text" id="form-qcrop" required value="${qCrop}" style="width:100%; padding:0.5rem; border:1px solid var(--border-color); border-radius:4px;">
                </div>
                <div class="control-group">
                    <label for="form-qtype">Query Intent Category</label>
                    <select id="form-qtype" style="width:100%; padding:0.5rem; border:1px solid var(--border-color); border-radius:4px;">
                        <option value="Market Rates & Info" ${qType === 'Market Rates & Info' ? 'selected' : ''}>Market Rates & Info</option>
                        <option value="Plant Protection" ${qType === 'Plant Protection' ? 'selected' : ''}>Plant Protection</option>
                        <option value="Government Schemes" ${qType === 'Government Schemes' ? 'selected' : ''}>Government Schemes</option>
                        <option value="Weather" ${qType === 'Weather' ? 'selected' : ''}>Weather</option>
                        <option value="Nutrient Management" ${qType === 'Nutrient Management' ? 'selected' : ''}>Nutrient Management</option>
                        <option value="Seeds" ${qType === 'Seeds' ? 'selected' : ''}>Seeds</option>
                    </select>
                </div>
                <div class="control-group">
                    <label for="form-qstate">State</label>
                    <input type="text" id="form-qstate" required value="${qState}" style="width:100%; padding:0.5rem; border:1px solid var(--border-color); border-radius:4px;">
                </div>
            `;
        } else {
            const sCrop = record ? record.crop : 'Onion';
            const sLoc = record ? record.location : 'Village_A';
            const sTemp = record ? record.temp : 25;
            const sSpoil = record ? record.spoilage : 'No';
            const sStore = record ? record.storage : 'No';
            
            modalFieldsContainer.innerHTML = `
                <div class="control-group">
                    <label for="form-scrop">Crop Type</label>
                    <select id="form-scrop" style="width:100%; padding:0.5rem; border:1px solid var(--border-color); border-radius:4px;">
                        <option value="Onion" ${sCrop === 'Onion' ? 'selected' : ''}>Onion</option>
                        <option value="Tomato" ${sCrop === 'Tomato' ? 'selected' : ''}>Tomato</option>
                        <option value="Maize" ${sCrop === 'Maize' ? 'selected' : ''}>Maize</option>
                        <option value="Potato" ${sCrop === 'Potato' ? 'selected' : ''}>Potato</option>
                        <option value="Wheat" ${sCrop === 'Wheat' ? 'selected' : ''}>Wheat</option>
                    </select>
                </div>
                <div class="control-group">
                    <label for="form-sloc">Location</label>
                    <select id="form-sloc" style="width:100%; padding:0.5rem; border:1px solid var(--border-color); border-radius:4px;">
                        <option value="Village_A" ${sLoc === 'Village_A' ? 'selected' : ''}>Village A</option>
                        <option value="Village_B" ${sLoc === 'Village_B' ? 'selected' : ''}>Village B</option>
                        <option value="Village_C" ${sLoc === 'Village_C' ? 'selected' : ''}>Village C</option>
                    </select>
                </div>
                <div class="control-group">
                    <label for="form-stemp">Storage Temperature (°C)</label>
                    <input type="number" id="form-stemp" required step="0.1" value="${sTemp}" style="width:100%; padding:0.5rem; border:1px solid var(--border-color); border-radius:4px;">
                </div>
                <div class="control-group">
                    <label for="form-sspoil">Spoilage Detected?</label>
                    <select id="form-sspoil" style="width:100%; padding:0.5rem; border:1px solid var(--border-color); border-radius:4px;">
                        <option value="Yes" ${sSpoil === 'Yes' ? 'selected' : ''}>Yes</option>
                        <option value="No" ${sSpoil === 'No' ? 'selected' : ''}>No</option>
                    </select>
                </div>
                <div class="control-group">
                    <label for="form-sstore">Closed Storage Area Access?</label>
                    <select id="form-sstore" style="width:100%; padding:0.5rem; border:1px solid var(--border-color); border-radius:4px;">
                        <option value="Yes" ${sStore === 'Yes' ? 'selected' : ''}>Yes (Closed)</option>
                        <option value="No" ${sStore === 'No' ? 'selected' : ''}>No (Open space)</option>
                    </select>
                </div>
            `;
        }
        
        crudModal.classList.remove('hidden');
    }

    function closeModal() {
        crudModal.classList.add('hidden');
        editingRecordId = null;
    }

    // Handles form submission
    crudForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const role = sessionStorage.getItem('koolkisaan_role') || 'user';
        if (role !== 'admin') {
            alert("Permission denied. Only Administrators can modify database records.");
            return;
        }
        
        if (crudActiveDataset === 'queries') {
            const query_text = document.getElementById('form-qtext').value.trim();
            const crop_extracted = document.getElementById('form-qcrop').value.trim();
            const query_type = document.getElementById('form-qtype').value;
            const state = document.getElementById('form-qstate').value.trim();
            
            const newRecord = {
                state: state,
                district: "Unknown",
                block: "Unknown",
                season: "Unknown",
                crop_extracted: crop_extracted,
                query_type: query_type,
                query_text: query_text,
                created_on: new Date().toISOString(),
                month: (new Date().getMonth() + 1).toString()
            };
            
            if (editingRecordId === null) {
                // Create
                queriesData.unshift(newRecord); // Add to beginning of array
            } else {
                // Update
                queriesData[editingRecordId] = newRecord;
            }
        } else {
            const crop = document.getElementById('form-scrop').value;
            const location = document.getElementById('form-sloc').value;
            const temp = parseFloat(document.getElementById('form-stemp').value);
            const spoilage = document.getElementById('form-sspoil').value;
            const storage = document.getElementById('form-sstore').value;
            
            if (editingRecordId === null) {
                // Create: find max ID
                const maxId = spoilageData.reduce((max, item) => item.record_id > max ? item.record_id : max, 0);
                const newRecord = {
                    record_id: maxId + 1,
                    date: new Date().toISOString().split('T')[0],
                    location: location,
                    crop: crop,
                    temp: temp,
                    spoilage: spoilage,
                    storage: storage
                };
                spoilageData.unshift(newRecord);
            } else {
                // Update
                const record = spoilageData.find(item => item.record_id === editingRecordId);
                if (record) {
                    record.crop = crop;
                    record.location = location;
                    record.temp = temp;
                    record.spoilage = spoilage;
                    record.storage = storage;
                }
            }
        }

        // Close modal and recalculate all stats & charts!
        closeModal();
        recalculateAllStats();
        renderCrudTable();
    });

    // Delete record trigger (bound to global window object)
    window.triggerDeleteRecord = function(dataset, id) {
        const role = sessionStorage.getItem('koolkisaan_role') || 'user';
        if (role !== 'admin') {
            alert("Permission denied. Only Administrators can delete database records.");
            return;
        }
        
        if (!confirm(`Are you sure you want to delete this record (#${id})?`)) return;
        
        if (dataset === 'queries') {
            queriesData.splice(id, 1);
        } else {
            const index = spoilageData.findIndex(item => item.record_id === id);
            if (index !== -1) {
                spoilageData.splice(index, 1);
            }
        }
        
        recalculateAllStats();
        renderCrudTable();
    };

    window.triggerEditRecord = function(dataset, id) {
        const role = sessionStorage.getItem('koolkisaan_role') || 'user';
        if (role !== 'admin') {
            alert("Permission denied. Only Administrators can edit database records.");
            return;
        }
        
        const record = dataset === 'queries' ? queriesData[id] : spoilageData.find(item => item.record_id === id);
        if (record) {
            openModal(record);
        }
    };

    // Client-side Recalculation of Dataset Stats
    function recalculateAllStats() {
        // --- 1. Recalculate Queries Counts ---
        const query_types = {};
        const states = {};
        const crops = {};
        const months = {};

        queriesData.forEach(q => {
            const qt = q.query_type;
            const st = q.state;
            const cr = q.crop_extracted;
            const mn = q.month;

            query_types[qt] = (query_types[qt] || 0) + 1;
            states[st] = (states[st] || 0) + 1;
            crops[cr] = (crops[cr] || 0) + 1;
            months[mn] = (months[mn] || 0) + 1;
        });

        statsData.query_types = query_types;
        statsData.states = states;
        statsData.crops = crops;
        statsData.months = months;
        statsData.total_queries = queriesData.length;

        // --- 2. Recalculate Spoilage Rates ---
        const crop_totals = {};
        const crop_spoiled = {};
        spoilageData.forEach(r => {
            const c = r.crop;
            const s = r.spoilage === 'Yes' ? 1 : 0;
            crop_totals[c] = (crop_totals[c] || 0) + 1;
            crop_spoiled[c] = (crop_spoiled[c] || 0) + s;
        });

        const rates_by_crop = {};
        for (const c in crop_totals) {
            rates_by_crop[c] = parseFloat(((crop_spoiled[c] / crop_totals[c]) * 100).toFixed(1));
        }

        // Bins
        const temp_bins = {"< 25C": {t:0, s:0}, "25C - 30C": {t:0, s:0}, "30C - 35C": {t:0, s:0}, "> 35C": {t:0, s:0}};
        spoilageData.forEach(r => {
            const temp = r.temp;
            const s = r.spoilage === 'Yes' ? 1 : 0;
            let b = '';
            if (temp < 25) b = "< 25C";
            else if (temp <= 30) b = "25C - 30C";
            else if (temp <= 35) b = "30C - 35C";
            else b = "> 35C";

            temp_bins[b].t += 1;
            temp_bins[b].s += s;
        });

        const rates_by_temp = {};
        for (const b in temp_bins) {
            rates_by_temp[b] = temp_bins[b].t > 0 ? parseFloat(((temp_bins[b].s / temp_bins[b].t) * 100).toFixed(1)) : 0;
        }

        // Storage
        const storage_stats = {"Yes": {t:0, s:0}, "No": {t:0, s:0}};
        spoilageData.forEach(r => {
            const st = r.storage;
            const s = r.spoilage === 'Yes' ? 1 : 0;
            storage_stats[st].t += 1;
            storage_stats[st].s += s;
        });

        const rates_by_storage = {
            "Yes": storage_stats["Yes"].t > 0 ? parseFloat(((storage_stats["Yes"].s / storage_stats["Yes"].t) * 100).toFixed(1)) : 0,
            "No": storage_stats["No"].t > 0 ? parseFloat(((storage_stats["No"].s / storage_stats["No"].t) * 100).toFixed(1)) : 0
        };

        // Naive Bayes Conditional counts
        const class_counts = {"Yes": 0, "No": 0};
        const conditional_counts = {
            "Yes": {"crop": {}, "location": {}, "temp_bin": {}, "storage": {}},
            "No":  {"crop": {}, "location": {}, "temp_bin": {}, "storage": {}}
        };

        spoilageData.forEach(r => {
            const lbl = r.spoilage;
            class_counts[lbl] += 1;
            const c = r.crop;
            const loc = r.location;
            const tb = r.temp > 30 ? "High" : "Low";
            const st = r.storage;
            
            conditional_counts[lbl].crop[c] = (conditional_counts[lbl].crop[c] || 0) + 1;
            conditional_counts[lbl].location[loc] = (conditional_counts[lbl].location[loc] || 0) + 1;
            conditional_counts[lbl].temp_bin[tb] = (conditional_counts[lbl].temp_bin[tb] || 0) + 1;
            conditional_counts[lbl].storage[st] = (conditional_counts[lbl].storage[st] || 0) + 1;
        });

        statsData.spoilage_stats = {
            rates_by_crop: rates_by_crop,
            rates_by_temp: rates_by_temp,
            rates_by_storage: rates_by_storage,
            class_counts: class_counts,
            conditional_counts: conditional_counts
        };

        // Re-train NLP index on modified queries!
        aiEngine.initialize(queriesData);

        // Refresh KPIs and active charts!
        populateKPIs();
        renderCharts();
    }

    // Sync to disk POST request
    btnSyncDisk.addEventListener('click', () => {
        btnSyncDisk.disabled = true;
        btnSyncDisk.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Syncing...`;
        
        const payload = {
            queries: queriesData,
            spoilage: spoilageData,
            stats: statsData
        };

        fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => res.json())
        .then(data => {
            btnSyncDisk.disabled = false;
            btnSyncDisk.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Sync changes to Disk`;
            
            if (data.status === 'success') {
                syncStatus.classList.remove('hidden');
                setTimeout(() => {
                    syncStatus.classList.add('hidden');
                }, 2000);
            } else {
                alert(`Error syncing database: ${data.message}`);
            }
        })
        .catch(err => {
            btnSyncDisk.disabled = false;
            btnSyncDisk.innerHTML = `<i class="fa-solid fa-cloud-arrow-up"></i> Sync changes to Disk`;
            alert(`Network error syncing data: ${err.message}`);
        });
    });

    // --- AUTHENTICATION & LOGIN PORTAL LOGIC ---
    const loginPortal = document.getElementById('login-portal');
    const mainAppContainer = document.getElementById('main-app-container');
    const loginForm = document.getElementById('login-form');
    const loginUsernameInput = document.getElementById('login-username');
    const loginPasswordInput = document.getElementById('login-password');
    const loginError = document.getElementById('login-error');
    const navLogout = document.getElementById('nav-logout');

    function updateRoleUI(role) {
        const roleBadge = document.getElementById('role-badge');
        const btnAddRecord = document.getElementById('btn-add-record');
        const btnSyncDisk = document.getElementById('btn-sync-disk');
        const crudReadonlyBanner = document.getElementById('crud-readonly-banner');
        const crudNavItem = document.querySelector('.nav-item[data-tab="crud"]');

        if (role === 'admin') {
            if (roleBadge) {
                roleBadge.innerHTML = `<i class="fa-solid fa-user-shield"></i> Admin`;
                roleBadge.style.backgroundColor = 'var(--accent-light)';
                roleBadge.style.color = 'var(--primary-dark)';
                roleBadge.style.borderColor = 'var(--primary-light)';
            }
            if (crudNavItem) crudNavItem.classList.remove('hidden');
            if (btnAddRecord) btnAddRecord.classList.remove('hidden');
            if (btnSyncDisk) btnSyncDisk.classList.remove('hidden');
            if (crudReadonlyBanner) crudReadonlyBanner.classList.add('hidden');
        } else {
            if (roleBadge) {
                roleBadge.innerHTML = `<i class="fa-solid fa-user"></i> User`;
                roleBadge.style.backgroundColor = '#edf2f7';
                roleBadge.style.color = '#4a5568';
                roleBadge.style.borderColor = '#cbd5e0';
            }
            if (crudNavItem) crudNavItem.classList.add('hidden');
            if (btnAddRecord) btnAddRecord.classList.add('hidden');
            if (btnSyncDisk) btnSyncDisk.classList.add('hidden');
            if (crudReadonlyBanner) crudReadonlyBanner.classList.remove('hidden');

            // Redirect if user is currently on the CRUD tab
            const activeTab = document.querySelector('.nav-item.active');
            if (activeTab && activeTab.getAttribute('data-tab') === 'crud') {
                const firstNavItem = document.querySelector('.nav-item[data-tab="task1"]');
                if (firstNavItem) firstNavItem.click();
            }
        }
    }

    function checkAuth() {
        const isAuthenticated = sessionStorage.getItem('koolkisaan_auth') === 'true';
        if (isAuthenticated) {
            loginPortal.classList.add('fade-out');
            mainAppContainer.classList.remove('hidden');
            
            const role = sessionStorage.getItem('koolkisaan_role') || 'user';
            updateRoleUI(role);
            
            loadData();
        } else {
            loginPortal.classList.remove('fade-out');
            mainAppContainer.classList.add('hidden');
        }
    }

    loginForm.addEventListener('submit', () => {
        const username = loginUsernameInput.value.trim();
        const password = loginPasswordInput.value;

        let role = '';
        if (username === 'admin' && password === 'admin123') {
            role = 'admin';
        } else if (username === 'user' && password === 'user123') {
            role = 'user';
        }

        if (role) {
            sessionStorage.setItem('koolkisaan_auth', 'true');
            sessionStorage.setItem('koolkisaan_role', role);
            loginError.classList.add('hidden');
            loginPortal.classList.add('fade-out');
            setTimeout(() => {
                mainAppContainer.classList.remove('hidden');
                loadData();
            }, 300);
        } else {
            loginError.classList.remove('hidden');
            loginError.style.animation = 'none';
            loginError.offsetHeight; // trigger reflow
            loginError.style.animation = null;
        }
    });

    navLogout.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent tab change on click
        if (confirm("Are you sure you want to sign out?")) {
            sessionStorage.removeItem('koolkisaan_auth');
            sessionStorage.removeItem('koolkisaan_role');
            loginUsernameInput.value = '';
            loginPasswordInput.value = '';
            // Reset tab highlights: activate Task 1 by default
            document.querySelectorAll('.nav-item').forEach(nav => nav.classList.remove('active'));
            const firstNavItem = document.querySelector('.nav-item[data-tab="task1"]');
            if (firstNavItem) {
                firstNavItem.classList.add('active');
                document.getElementById('page-title-text').textContent = 'Task 1: Query Distribution and Analysis';
                document.getElementById('current-tab-name').textContent = 'Task 1: Query Analysis';
                // Show Task 1 pane and hide others
                document.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                const activePane = document.getElementById('tab-task1');
                if (activePane) activePane.classList.add('active');
            }
            checkAuth();
        }
    });

    // ==========================================================================
    // PRO EXTENSIONS CONTROLLER (Voice AI, Crop Doctor, Digital Twin, Geo Map, Slip)
    // ==========================================================================
    let activeDoctorPreset = 'tomato_early_blight';
    let proExtensionsInitialized = false;

    function initProExtensions() {
        if (proExtensionsInitialized) return;
        proExtensionsInitialized = true;

        // 1. Language Selector & Theme Switcher
        const langSelector = document.getElementById('lang-selector');
        if (langSelector) {
            langSelector.addEventListener('change', (e) => {
                const lang = e.target.value;
                if (window.agriVoice) {
                    window.agriVoice.setLanguage(lang);
                }
            });
        }

        const themeToggleBtn = document.getElementById('btn-theme-toggle');
        if (themeToggleBtn) {
            // Restore theme preference
            if (localStorage.getItem('koolkisaan_theme') === 'dark') {
                document.body.classList.add('dark-theme');
                themeToggleBtn.innerHTML = '<i class="fa-solid fa-sun"></i>';
            }
            themeToggleBtn.addEventListener('click', () => {
                document.body.classList.toggle('dark-theme');
                const isDark = document.body.classList.contains('dark-theme');
                localStorage.setItem('koolkisaan_theme', isDark ? 'dark' : 'light');
                themeToggleBtn.innerHTML = isDark ? '<i class="fa-solid fa-sun"></i>' : '<i class="fa-solid fa-moon"></i>';
            });
        }

        // 2. Voice AI Quick Mic (Header)
        const btnQuickVoice = document.getElementById('btn-quick-voice');
        const quickVoiceLabel = document.getElementById('quick-voice-label');
        if (btnQuickVoice && window.agriVoice) {
            btnQuickVoice.addEventListener('click', () => {
                if (window.agriVoice.isListening) {
                    window.agriVoice.stopListening();
                    return;
                }

                btnQuickVoice.classList.add('listening');
                if (quickVoiceLabel) quickVoiceLabel.textContent = 'Listening...';

                window.agriVoice.startListening(
                    (text, isFinal) => {
                        if (isFinal) {
                            btnQuickVoice.classList.remove('listening');
                            if (quickVoiceLabel) quickVoiceLabel.textContent = 'Voice AI';

                            // Check active tab
                            const activePane = document.querySelector('.tab-pane.active');
                            const activeTabId = activePane ? activePane.id : '';

                            if (activeTabId === 'tab-task2') {
                                const input = document.getElementById('classifier-input');
                                if (input) {
                                    input.value = text;
                                    document.getElementById('btn-classify').click();
                                }
                            } else {
                                // Default or Task 3: Switch to task3 and search
                                const navTask3 = document.querySelector('.nav-item[data-tab="task3"]');
                                if (navTask3) navTask3.click();
                                const retInput = document.getElementById('retriever-input');
                                if (retInput) {
                                    retInput.value = text;
                                    document.getElementById('btn-search').click();
                                }
                            }
                        }
                    },
                    (isListening) => {
                        if (!isListening) {
                            btnQuickVoice.classList.remove('listening');
                            if (quickVoiceLabel) quickVoiceLabel.textContent = 'Voice AI';
                        }
                    }
                );
            });
        }

        // Voice mic inside Task 2 Intent Classifier
        const btnMicClassifier = document.getElementById('btn-mic-classifier');
        if (btnMicClassifier && window.agriVoice) {
            btnMicClassifier.addEventListener('click', () => {
                if (window.agriVoice.isListening) {
                    window.agriVoice.stopListening();
                    return;
                }
                btnMicClassifier.classList.add('listening');
                window.agriVoice.startListening(
                    (text, isFinal) => {
                        const input = document.getElementById('classifier-input');
                        if (input) input.value = text;
                        if (isFinal) {
                            btnMicClassifier.classList.remove('listening');
                            document.getElementById('btn-classify').click();
                        }
                    },
                    (isListening) => {
                        if (!isListening) btnMicClassifier.classList.remove('listening');
                    }
                );
            });
        }

        // Voice mic inside Task 3 Retriever
        const btnMicRetriever = document.getElementById('btn-mic-retriever');
        if (btnMicRetriever && window.agriVoice) {
            btnMicRetriever.addEventListener('click', () => {
                if (window.agriVoice.isListening) {
                    window.agriVoice.stopListening();
                    return;
                }
                btnMicRetriever.classList.add('listening');
                window.agriVoice.startListening(
                    (text, isFinal) => {
                        const input = document.getElementById('retriever-input');
                        if (input) input.value = text;
                        if (isFinal) {
                            btnMicRetriever.classList.remove('listening');
                            document.getElementById('btn-search').click();
                        }
                    },
                    (isListening) => {
                        if (!isListening) btnMicRetriever.classList.remove('listening');
                    }
                );
            });
        }

        // TTS Read Aloud for Task 2 Classifier
        const btnSpeakIntent = document.getElementById('btn-speak-intent');
        if (btnSpeakIntent && window.agriVoice) {
            btnSpeakIntent.addEventListener('click', () => {
                const predictedName = document.getElementById('class-predicted-name').textContent;
                const confidence = document.getElementById('class-confidence-val').textContent;
                const message = `The predicted farmer query intent is ${predictedName}, with a confidence score of ${confidence}.`;
                window.agriVoice.speak(message);
            });
        }

        // Show speak button when classifier finishes
        const btnClassify = document.getElementById('btn-classify');
        if (btnClassify && btnSpeakIntent) {
            const origClassifyClick = btnClassify.onclick;
            btnClassify.addEventListener('click', () => {
                setTimeout(() => {
                    btnSpeakIntent.classList.remove('hidden');
                }, 300);
            });
        }

        // TTS Read Aloud for Task 3 Advisory
        const btnReadAloud = document.getElementById('btn-read-aloud');
        if (btnReadAloud && window.agriVoice) {
            btnReadAloud.addEventListener('click', () => {
                const draftText = document.getElementById('faq-response-text').value;
                if (draftText) {
                    window.agriVoice.speak(draftText);
                }
            });
        }

        // 3. TASK 4: AI CROP DOCTOR (Vision Diagnostics)
        window.renderActiveCropDoctor = function(customImg = null) {
            const canvas = document.getElementById('doctor-canvas');
            if (!canvas || !window.agriCropDoctor) return;

            window.agriCropDoctor.renderLeafToCanvas(canvas, activeDoctorPreset, customImg);
            window.agriCropDoctor.drawBoundingBoxes(canvas, activeDoctorPreset);

            // Update details
            const preset = window.agriCropDoctor.getPreset(activeDoctorPreset);
            document.getElementById('diag-crop-name').textContent = preset.crop;
            document.getElementById('diag-disease-name').textContent = preset.diseaseName;
            document.getElementById('diag-pathogen-type').textContent = preset.type;
            document.getElementById('diag-confidence-num').textContent = `${preset.confidence}%`;
            document.getElementById('diag-severity-text').textContent = preset.severity;
            document.getElementById('diag-symptoms-text').textContent = preset.symptoms;
            document.getElementById('diag-organic-recipe').textContent = preset.organicRecipe;
            document.getElementById('diag-chemical-recipe').textContent = preset.chemicalRecipe;

            // Update severity bar fill
            const severityPercent = parseInt(preset.severity.match(/\d+/) ? preset.severity.match(/\d+/)[0] : '20');
            const barFill = document.getElementById('diag-severity-fill');
            if (barFill) {
                barFill.style.width = `${severityPercent}%`;
                barFill.style.backgroundColor = preset.themeColor;
            }
        };

        // Preset selector clicks
        const presetButtons = document.querySelectorAll('.preset-btn');
        presetButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                presetButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                activeDoctorPreset = btn.getAttribute('data-preset');
                window.renderActiveCropDoctor();
            });
        });

        // Upload custom leaf image
        const fileInput = document.getElementById('doctor-file-input');
        if (fileInput) {
            fileInput.addEventListener('change', (e) => {
                const file = e.target.files[0];
                if (file) {
                    const reader = new FileReader();
                    reader.onload = (evt) => {
                        const img = new Image();
                        img.onload = () => {
                            window.renderActiveCropDoctor(img);
                        };
                        img.src = evt.target.result;
                    };
                    reader.readAsDataURL(file);
                }
            });
        }

        const btnScanAgain = document.getElementById('btn-scan-again');
        if (btnScanAgain) {
            btnScanAgain.addEventListener('click', () => {
                window.renderActiveCropDoctor();
            });
        }

        // TTS Read Aloud for Crop Doctor
        const btnSpeakDoctor = document.getElementById('btn-speak-doctor');
        if (btnSpeakDoctor && window.agriVoice) {
            btnSpeakDoctor.addEventListener('click', () => {
                const preset = window.agriCropDoctor.getPreset(activeDoctorPreset);
                const speech = `Diagnosis: ${preset.crop} infected with ${preset.diseaseName}. Severity is ${preset.severity}. Organic remedy: ${preset.organicRecipe}. Chemical treatment: ${preset.chemicalRecipe}.`;
                window.agriVoice.speak(speech);
            });
        }

        // 4. TASK 5: STORAGE DIGITAL TWIN (Physics & Loss Simulator)
        window.runDigitalTwinSim = function() {
            if (!window.agriDigitalTwin) return;

            const crop = document.getElementById('twin-crop').value;
            const temp = parseFloat(document.getElementById('twin-temp').value);
            const humidity = parseFloat(document.getElementById('twin-humidity').value);
            const ventilation = document.getElementById('twin-ventilation').value;
            const packaging = document.getElementById('twin-packaging').value;
            const durationDays = parseFloat(document.getElementById('twin-duration').value);
            const lotSizeQuintals = parseFloat(document.getElementById('twin-lotsize').value) || 100;
            const customPrice = parseFloat(document.getElementById('twin-price').value) || 2800;

            // Live pill labels
            document.getElementById('val-twin-temp').textContent = `${temp}°C`;
            document.getElementById('val-twin-humidity').textContent = `${humidity}%`;
            document.getElementById('val-twin-duration').textContent = `${durationDays} Days`;

            const sim = window.agriDigitalTwin.simulate({
                crop,
                temp,
                humidity,
                ventilation,
                packaging,
                durationDays,
                lotSizeQuintals,
                customPrice
            });

            // Update UI
            document.getElementById('twin-shelf-days').textContent = sim.estimatedShelfLifeDays;
            document.getElementById('twin-shelf-hours').textContent = `(~${sim.estimatedShelfLifeHours} Hours Remaining)`;

            const gaugeBar = document.getElementById('twin-spoil-gauge');
            if (gaugeBar) {
                gaugeBar.style.width = `${sim.spoilageProbability}%`;
                gaugeBar.style.backgroundColor = sim.riskColor;
            }
            document.getElementById('twin-spoil-val').textContent = `${sim.spoilageProbability}%`;

            const badge = document.getElementById('twin-risk-badge');
            if (badge) {
                badge.className = `risk-badge ${sim.riskBadgeClass}`;
                badge.textContent = sim.riskCategory;
            }

            document.getElementById('twin-total-val').textContent = `₹${sim.totalLotValue.toLocaleString()}`;
            document.getElementById('twin-loss-val').textContent = `₹${sim.financialLossINR.toLocaleString()}`;
            document.getElementById('twin-savings-val').textContent = `₹${sim.potentialSavingsINR.toLocaleString()}`;

            const actionsList = document.getElementById('twin-actions-list');
            if (actionsList) {
                actionsList.innerHTML = sim.climateActions.map(action => `
                    <li><i class="fa-solid fa-circle-arrow-right text-emerald"></i> ${action}</li>
                `).join('');
            }
        };

        // Attach live input events to twin controls
        ['twin-crop', 'twin-temp', 'twin-humidity', 'twin-ventilation', 'twin-packaging', 'twin-duration', 'twin-lotsize', 'twin-price'].forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                el.addEventListener('input', () => window.runDigitalTwinSim());
            }
        });

        const btnRunTwin = document.getElementById('btn-run-twin');
        if (btnRunTwin) {
            btnRunTwin.addEventListener('click', () => window.runDigitalTwinSim());
        }

        // 5. TASK 6: GEO-SPATIAL GIS MAP & MANDIS
        window.renderAgriMap = function() {
            if (!window.agriGeoEngine) return;

            window.agriGeoEngine.renderMap('svg-map-render-area', (state) => {
                document.getElementById('geo-selected-state-sub').textContent = `Selected Region: ${state.name}`;
                document.getElementById('geo-state-name').textContent = state.name;
                document.getElementById('geo-state-hub').innerHTML = `<i class="fa-solid fa-building-wheat"></i> APMC: ${state.mandiHub}`;
                document.getElementById('geo-state-queries').textContent = state.queryCount;
                document.getElementById('geo-alert-text').textContent = state.topAlert;
                document.getElementById('geo-state-crops').textContent = state.topCrops.join(', ');
                document.getElementById('geo-state-risk').textContent = state.storageRisk;

                // Update alert banner styling
                const banner = document.getElementById('geo-alert-banner');
                if (banner) {
                    if (state.topAlertSeverity === 'danger') {
                        banner.style.backgroundColor = '#fee2e2';
                        banner.style.color = '#991b1b';
                        banner.style.borderLeftColor = '#ef4444';
                    } else if (state.topAlertSeverity === 'warning') {
                        banner.style.backgroundColor = '#fef3c7';
                        banner.style.color = '#92400e';
                        banner.style.borderLeftColor = '#f59e0b';
                    } else {
                        banner.style.backgroundColor = '#dcfce7';
                        banner.style.color = '#166534';
                        banner.style.borderLeftColor = '#22c55e';
                    }
                }
            });

            window.agriGeoEngine.renderTicker('mandi-ticker-container');
        };

        // Render ticker immediately on page load
        if (window.agriGeoEngine) {
            window.agriGeoEngine.renderTicker('mandi-ticker-container');
        }

        // 6. OFFICIAL KISAAN ADVISORY PRESCRIPTION MODAL
        const prescriptionModal = document.getElementById('prescription-modal');
        const btnCloseSlip = document.getElementById('btn-close-slip');
        const btnDismissSlip = document.getElementById('btn-dismiss-slip');
        const btnPrintSlip = document.getElementById('btn-print-slip');
        const btnShareWhatsApp = document.getElementById('btn-share-whatsapp');

        function openPrescriptionModal(options = {}) {
            if (!prescriptionModal) return;

            const refId = `KK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
            const dateStr = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

            document.getElementById('slip-ref-id').textContent = `Ref: ${refId}`;
            document.getElementById('slip-date-time').textContent = `Date: ${dateStr}`;

            if (options.caseSummary) document.getElementById('slip-case-summary').innerHTML = options.caseSummary;
            if (options.diagnosticSummary) document.getElementById('slip-diagnostic-summary').innerHTML = options.diagnosticSummary;
            if (options.prescriptionText) document.getElementById('slip-prescription-text').innerHTML = options.prescriptionText;

            prescriptionModal.classList.remove('hidden');
        }

        if (btnCloseSlip) btnCloseSlip.addEventListener('click', () => prescriptionModal.classList.add('hidden'));
        if (btnDismissSlip) btnDismissSlip.addEventListener('click', () => prescriptionModal.classList.add('hidden'));

        if (btnPrintSlip) {
            btnPrintSlip.addEventListener('click', () => {
                window.print();
            });
        }

        if (btnShareWhatsApp) {
            btnShareWhatsApp.addEventListener('click', () => {
                const caseInfo = document.getElementById('slip-case-summary').innerText;
                const diagInfo = document.getElementById('slip-diagnostic-summary').innerText;
                const rxInfo = document.getElementById('slip-prescription-text').innerText;
                const message = `*🌾 IIT Ropar ANNAM.AI - KoolKisaan Advisory Slip*\n\n📌 *Dossier:* ${caseInfo}\n🔍 *Diagnosis:* ${diagInfo}\n\n💊 *Prescribed Treatment (Rx):*\n${rxInfo}\n\n_Generated via KoolKisaan Precision Agriculture Portal_`;
                const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(message)}`;
                window.open(whatsappUrl, '_blank');
            });
        }

        // Open slip from Crop Doctor
        const btnGenerateSlipDoctor = document.getElementById('btn-generate-slip-doctor');
        if (btnGenerateSlipDoctor) {
            btnGenerateSlipDoctor.addEventListener('click', () => {
                const preset = window.agriCropDoctor ? window.agriCropDoctor.getPreset(activeDoctorPreset) : null;
                if (!preset) return;

                openPrescriptionModal({
                    caseSummary: `<strong>Crop:</strong> ${preset.crop} | <strong>Diagnosis Mode:</strong> Computer Vision Leaf Scan | <strong>Confidence:</strong> ${preset.confidence}%`,
                    diagnosticSummary: `<strong>Pathogen:</strong> ${preset.diseaseName} (${preset.type})<br><strong>Severity:</strong> ${preset.severity}<br><strong>Symptoms:</strong> ${preset.symptoms}`,
                    prescriptionText: `<strong>1. Bio-control / Organic Recipe:</strong><br>${preset.organicRecipe}<br><br><strong>2. Chemical Protection (IPM):</strong><br>${preset.chemicalRecipe}`
                });
            });
        }

        // Open slip from Task 3 FAQ
        const btnGenerateSlipFaq = document.getElementById('btn-generate-slip-faq');
        if (btnGenerateSlipFaq) {
            btnGenerateSlipFaq.addEventListener('click', () => {
                const cropMeta = document.getElementById('draft-crop-cat').textContent;
                const adviceText = document.getElementById('faq-response-text').value;
                const diagText = document.getElementById('diagnosis-text').textContent;

                openPrescriptionModal({
                    caseSummary: `<strong>Metadata:</strong> ${cropMeta} | <strong>Channel:</strong> Helpdesk Retrieval`,
                    diagnosticSummary: `<strong>Semantic Match:</strong> ${diagText}`,
                    prescriptionText: `<strong>Drafted Advisory Response:</strong><br>${adviceText.replace(/\n/g, '<br>')}`
                });
            });
        }

        // Initial renders for background tabs
        window.renderActiveCropDoctor();
        window.runDigitalTwinSim();
        window.renderAgriMap();
    }

    // Initialize Auth Check
    checkAuth();
});

