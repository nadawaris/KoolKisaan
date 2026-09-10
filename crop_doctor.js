/**
 * KoolKisaan AI Crop Doctor: Vision-Based Plant Disease Diagnostics
 * Simulates high-precision convolutional neural network (CNN) detection
 * with interactive bounding boxes, infection severity heatmaps, and IPM prescriptions.
 */

class CropDoctorEngine {
    constructor() {
        this.diseaseDatabase = {
            'tomato_early_blight': {
                id: 'tomato_early_blight',
                crop: 'Tomato',
                diseaseName: 'Early Blight (Alternaria solani)',
                type: 'Fungal Infection',
                confidence: 94.8,
                severity: 'Moderate (28% Foliar Area)',
                symptoms: 'Concentric dark brown rings on older leaves forming "target board" lesions with yellow chlorotic halos.',
                organicRecipe: 'Spray 5% Neem Seed Kernel Extract (NSKE) or Trichoderma viride @ 5g/liter at 10-day intervals. Remove infected lower leaves.',
                chemicalRecipe: 'Foliar spray of Mancozeb 75% WP @ 2.5 g/L or Azoxystrobin 23% SC @ 1.0 ml/L. Pre-Harvest Interval (PHI): 5 days.',
                boxes: [
                    { x: 0.18, y: 0.22, w: 0.35, h: 0.38, label: 'Alternaria Ring (96%)' },
                    { x: 0.58, y: 0.42, w: 0.28, h: 0.32, label: 'Chlorotic Halo (92%)' }
                ],
                themeColor: '#d97706',
                sampleColor: '#b45309'
            },
            'wheat_yellow_rust': {
                id: 'wheat_yellow_rust',
                crop: 'Wheat',
                diseaseName: 'Yellow Stripe Rust (Puccinia striiformis)',
                type: 'Airborne Fungal Rust',
                confidence: 97.2,
                severity: 'Critical (52% Foliar Area)',
                symptoms: 'Parallel linear yellow-orange powdery pustules along leaf veins. Rapid spore dispersal during cool humid mornings.',
                organicRecipe: 'Apply fermented butter-milk (chhaachh) 5% solution with wood ash dusting to suppress active spore sporulation.',
                chemicalRecipe: 'Immediate spray of Propiconazole 25% EC (Tilt) @ 1 ml/L or Tebuconazole 25.9% EC @ 1.25 ml/L. Repeat after 15 days if stripe progression continues.',
                boxes: [
                    { x: 0.25, y: 0.15, w: 0.22, h: 0.70, label: 'Stripe Pustule A (98%)' },
                    { x: 0.52, y: 0.20, w: 0.24, h: 0.65, label: 'Stripe Pustule B (95%)' }
                ],
                themeColor: '#dc2626',
                sampleColor: '#ea580c'
            },
            'onion_purple_blotch': {
                id: 'onion_purple_blotch',
                crop: 'Onion',
                diseaseName: 'Purple Blotch (Alternaria porri)',
                type: 'Fungal Leaf & Neck Rot',
                confidence: 92.4,
                severity: 'High (41% Foliar Area)',
                symptoms: 'Water-soaked lesions on leaves turning sunken, purple-brown with concentric darker margins. Leads to post-harvest bulb decay.',
                organicRecipe: 'Seedling root dip with Pseudomonas fluorescens @ 10g/L. Foliar spray of garlic-chili extract 3%.',
                chemicalRecipe: 'Spray Chlorothalonil 75% WP @ 2g/L or Difenoconazole 25% EC @ 1 ml/L mixed with sticking agent (Triton/Teepol 0.5ml/L).',
                boxes: [
                    { x: 0.20, y: 0.30, w: 0.45, h: 0.40, label: 'Purple Necrotic Core (93%)' },
                    { x: 0.60, y: 0.25, w: 0.25, h: 0.35, label: 'Foliar Lesion (89%)' }
                ],
                themeColor: '#9333ea',
                sampleColor: '#7e22ce'
            },
            'paddy_bacterial_blight': {
                id: 'paddy_bacterial_blight',
                crop: 'Paddy / Rice',
                diseaseName: 'Bacterial Leaf Blight (Xanthomonas oryzae)',
                type: 'Bacterial Vascular Wilt',
                confidence: 91.5,
                severity: 'Moderate (34% Foliar Area)',
                symptoms: 'Water-soaked translucent stripes along leaf margins with wavy borders drying into grayish-white bleached strips.',
                organicRecipe: 'Drain standing field water for 3 days to reduce humidity. Spray fresh cow dung extract supernatant (20%) with neem oil.',
                chemicalRecipe: 'Spray Streptocycline @ 0.15 g/L + Copper Oxychloride 50% WP @ 2.5 g/L. Avoid excess Nitrogen application.',
                boxes: [
                    { x: 0.15, y: 0.12, w: 0.30, h: 0.72, label: 'Marginal Blight (92%)' },
                    { x: 0.50, y: 0.30, w: 0.35, h: 0.45, label: 'Bacterial Exudate (88%)' }
                ],
                themeColor: '#ca8a04',
                sampleColor: '#a16207'
            },
            'healthy_citrus': {
                id: 'healthy_citrus',
                crop: 'Citrus (Kinnow / Lemon)',
                diseaseName: 'No Pathogen Detected (Healthy Plant)',
                type: 'Optimal Physiology',
                confidence: 99.1,
                severity: 'Safe (0% Foliar Damage)',
                symptoms: 'Vibrant chlorophyll density, smooth waxy cuticle, well-formed leaf veins with no necrotic lesions or fungal sporulation.',
                organicRecipe: 'Maintain balanced micronutrient spray (Zinc Sulphate 0.5% + Ferrous Sulphate 0.2%) to preserve high vegetative vigor.',
                chemicalRecipe: 'No chemical intervention required. Continue standard preventative orchard sanitation.',
                boxes: [
                    { x: 0.20, y: 0.20, w: 0.60, h: 0.60, label: 'Healthy Cuticle (99%)' }
                ],
                themeColor: '#16a34a',
                sampleColor: '#15803d'
            }
        };
    }

    getPreset(presetId) {
        return this.diseaseDatabase[presetId] || this.diseaseDatabase['tomato_early_blight'];
    }

    getAllPresets() {
        return Object.values(this.diseaseDatabase);
    }

    /**
     * Procedurally render synthetic plant leaf and disease patterns onto canvas
     */
    renderLeafToCanvas(canvas, presetId, userImage = null) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;

        ctx.clearRect(0, 0, w, h);

        if (userImage) {
            ctx.drawImage(userImage, 0, 0, w, h);
            return;
        }

        const preset = this.getPreset(presetId);

        // Background subtle soil/farm gradient
        const bgGrad = ctx.createLinearGradient(0, 0, w, h);
        bgGrad.addColorStop(0, '#1a2e22');
        bgGrad.addColorStop(1, '#0f1d15');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, w, h);

        // Grid lines to look like AI scanner
        ctx.strokeStyle = 'rgba(82, 183, 136, 0.15)';
        ctx.lineWidth = 1;
        for (let x = 0; x < w; x += 40) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, h);
            ctx.stroke();
        }
        for (let y = 0; y < h; y += 40) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(w, y);
            ctx.stroke();
        }

        // Draw leaf silhouette
        ctx.save();
        ctx.translate(w / 2, h / 2);
        
        ctx.beginPath();
        // Stylized organic leaf shape
        ctx.moveTo(0, -h * 0.42);
        ctx.bezierCurveTo(w * 0.40, -h * 0.25, w * 0.42, h * 0.25, 0, h * 0.42);
        ctx.bezierCurveTo(-w * 0.42, h * 0.25, -w * 0.40, -h * 0.25, 0, -h * 0.42);
        ctx.closePath();

        const leafGrad = ctx.createRadialGradient(0, 0, 10, 0, 0, w * 0.4);
        if (preset.id === 'healthy_citrus') {
            leafGrad.addColorStop(0, '#4ade80');
            leafGrad.addColorStop(0.7, '#16a34a');
            leafGrad.addColorStop(1, '#14532d');
        } else {
            leafGrad.addColorStop(0, '#86efac');
            leafGrad.addColorStop(0.6, '#22c55e');
            leafGrad.addColorStop(1, '#14532d');
        }
        ctx.fillStyle = leafGrad;
        ctx.fill();

        // Leaf primary vein
        ctx.strokeStyle = '#15803d';
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(0, -h * 0.40);
        ctx.quadraticCurveTo(5, 0, 0, h * 0.40);
        ctx.stroke();

        // Secondary lateral veins
        ctx.lineWidth = 2;
        ctx.strokeStyle = 'rgba(21, 128, 61, 0.6)';
        for (let i = -4; i <= 4; i++) {
            const vy = i * (h * 0.08);
            ctx.beginPath();
            ctx.moveTo(0, vy);
            ctx.lineTo(w * 0.25, vy - 20);
            ctx.stroke();

            ctx.beginPath();
            ctx.moveTo(0, vy);
            ctx.lineTo(-w * 0.25, vy - 20);
            ctx.stroke();
        }

        ctx.restore();

        // Render Disease Lesions based on preset
        if (preset.id === 'tomato_early_blight') {
            this.drawConcentricLesion(ctx, w * 0.35, h * 0.42, 45, '#78350f', '#d97706');
            this.drawConcentricLesion(ctx, w * 0.65, h * 0.55, 32, '#78350f', '#f59e0b');
        } else if (preset.id === 'wheat_yellow_rust') {
            this.drawStripeRust(ctx, w * 0.35, h * 0.18, w * 0.12, h * 0.65, '#ea580c');
            this.drawStripeRust(ctx, w * 0.58, h * 0.22, w * 0.10, h * 0.58, '#f97316');
        } else if (preset.id === 'onion_purple_blotch') {
            this.drawPurpleBlotch(ctx, w * 0.42, h * 0.48, 50, '#581c87', '#9333ea');
            this.drawPurpleBlotch(ctx, w * 0.68, h * 0.38, 28, '#581c87', '#a855f7');
        } else if (preset.id === 'paddy_bacterial_blight') {
            this.drawBacterialMargin(ctx, w * 0.22, h * 0.20, w * 0.18, h * 0.60, '#fef08a', '#ca8a04');
        }
    }

    drawConcentricLesion(ctx, cx, cy, radius, darkColor, haloColor) {
        // Halo
        const haloGrad = ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.3);
        haloGrad.addColorStop(0, haloColor);
        haloGrad.addColorStop(1, 'rgba(234, 179, 8, 0)');
        ctx.fillStyle = haloGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius * 1.3, 0, Math.PI * 2);
        ctx.fill();

        // Rings
        ctx.fillStyle = darkColor;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = '#451a03';
        ctx.lineWidth = 3;
        for (let r = 8; r < radius; r += 10) {
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, Math.PI * 2);
            ctx.stroke();
        }
    }

    drawStripeRust(ctx, x, y, width, height, color) {
        ctx.fillStyle = color;
        for (let dy = 0; dy < height; dy += 14) {
            for (let dx = 0; dx < width; dx += 8) {
                if (Math.random() > 0.2) {
                    ctx.beginPath();
                    ctx.ellipse(x + dx, y + dy, 3.5, 7, 0, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    }

    drawPurpleBlotch(ctx, cx, cy, radius, darkPurple, lightPurple) {
        const blotchGrad = ctx.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius);
        blotchGrad.addColorStop(0, darkPurple);
        blotchGrad.addColorStop(0.7, lightPurple);
        blotchGrad.addColorStop(1, 'rgba(147, 51, 234, 0)');
        ctx.fillStyle = blotchGrad;
        ctx.beginPath();
        ctx.arc(cx, cy, radius, 0, Math.PI * 2);
        ctx.fill();
    }

    drawBacterialMargin(ctx, x, y, w, h, lightYellow, gold) {
        ctx.fillStyle = lightYellow;
        ctx.strokeStyle = gold;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + w, y + 20);
        ctx.lineTo(x + w * 0.8, y + h);
        ctx.lineTo(x, y + h);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }

    /**
     * Draw AI vision detection bounding boxes and confidence flags
     */
    drawBoundingBoxes(canvas, presetId) {
        const ctx = canvas.getContext('2d');
        const w = canvas.width;
        const h = canvas.height;
        const preset = this.getPreset(presetId);

        preset.boxes.forEach(box => {
            const bx = box.x * w;
            const by = box.y * h;
            const bw = box.w * w;
            const bh = box.h * h;

            // Bounding box rectangle with neon accent
            ctx.strokeStyle = '#22c55e';
            ctx.lineWidth = 2.5;
            ctx.setLineDash([6, 4]);
            ctx.strokeRect(bx, by, bw, bh);
            ctx.setLineDash([]);

            // Corner brackets
            const cornerSize = 12;
            ctx.strokeStyle = '#4ade80';
            ctx.lineWidth = 3.5;

            // Top-left
            ctx.beginPath();
            ctx.moveTo(bx, by + cornerSize); ctx.lineTo(bx, by); ctx.lineTo(bx + cornerSize, by);
            ctx.stroke();

            // Top-right
            ctx.beginPath();
            ctx.moveTo(bx + bw - cornerSize, by); ctx.lineTo(bx + bw, by); ctx.lineTo(bx + bw, by + cornerSize);
            ctx.stroke();

            // Bottom-left
            ctx.beginPath();
            ctx.moveTo(bx, by + bh - cornerSize); ctx.lineTo(bx, by + bh); ctx.lineTo(bx + cornerSize, by + bh);
            ctx.stroke();

            // Bottom-right
            ctx.beginPath();
            ctx.moveTo(bx + bw - cornerSize, by + bh); ctx.lineTo(bx + bw, by + bh); ctx.lineTo(bx + bw, by + bh - cornerSize);
            ctx.stroke();

            // Label tag background
            ctx.fillStyle = 'rgba(20, 83, 45, 0.9)';
            const tagW = ctx.measureText(box.label).width + 24;
            const tagH = 22;
            ctx.fillRect(bx, by - tagH, tagW, tagH);

            // Label text
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px "Outfit", sans-serif';
            ctx.fillText(box.label, bx + 6, by - 6);
        });
    }
}

// Global instance
window.agriCropDoctor = new CropDoctorEngine();
