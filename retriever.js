/**
 * KoolKisaan AI Engine: Client-Side NLP & Retrieval
 * Implements TF-IDF vector space model, cosine similarity, and nearest centroid classifier.
 */

class AgriNLP {
    constructor() {
        this.queries = [];
        this.vocabulary = new Set();
        this.docVectors = []; // Array of Maps {word => tf-idf} normalized
        this.idf = {};
        this.centroids = {}; // category => Map{word => weight}
        this.stopwords = new Set([
            'farmer', 'asked', 'about', 'for', 'the', 'a', 'in', 'of', 'on', 'to', 'and', 
            'is', 'what', 'how', 'which', 'are', 'with', 'at', 'from', 'by', 'an', 'any',
            'problem', 'time', 'under', 'query', 'question', 'please'
        ]);
        this.synonyms = {
            'ourea': 'urea',
            'subsdy': 'subsidy',
            'leafe': 'leaf',
            'curry': 'curl',
            'bamsati': 'basmati',
            'mandi': 'market',
            'rates': 'rate',
            'govt': 'government',
            'hw': 'how',
            'shceme': 'scheme',
            'ferti': 'fertilizer',
            'peste': 'pest',
            'desease': 'disease',
            'controll': 'control',
            'bug': 'pest',
            'cure': 'control'
        };
    }

    // Clean and tokenize text
    tokenize(text) {
        if (!text) return [];
        return text.toLowerCase()
            .replace(/[^\w\s-]/g, ' ') // remove punctuation
            .split(/\s+/)
            .map(word => word.trim())
            .map(word => this.synonyms[word] || word) // Apply spelling correction / synonym expansion
            .filter(word => word.length > 1 && !this.stopwords.has(word));
    }

    // Train/Initialize index and classifier
    initialize(queries) {
        this.queries = queries;
        const N = queries.length;
        const df = {};

        // 1. First pass: tokenize all documents and calculate Document Frequencies (DF)
        const tokenizedDocs = queries.map(q => {
            const tokens = this.tokenize(q.query_text);
            const uniqueTokens = new Set(tokens);
            uniqueTokens.forEach(token => {
                df[token] = (df[token] || 0) + 1;
                this.vocabulary.add(token);
            });
            return tokens;
        });

        // 2. Compute Inverse Document Frequency (IDF)
        for (const word of this.vocabulary) {
            // Standard IDF formula with smoothing
            this.idf[word] = Math.log(1 + N / df[word]);
        }

        // 3. Compute TF-IDF vector for each document
        this.docVectors = tokenizedDocs.map((tokens, idx) => {
            const tf = {};
            tokens.forEach(token => {
                tf[token] = (tf[token] || 0) + 1;
            });

            const vector = new Map();
            let sumSq = 0;

            // Calculate TF-IDF weights
            for (const [word, count] of Object.entries(tf)) {
                const weight = count * this.idf[word];
                vector.set(word, weight);
                sumSq += weight * weight;
            }

            // L2 normalization so cosine similarity is just dot product
            const norm = Math.sqrt(sumSq);
            if (norm > 0) {
                for (const [word, weight] of vector.entries()) {
                    vector.set(word, weight / norm);
                }
            }

            return {
                index: idx,
                vector: vector,
                query_type: queries[idx].query_type
            };
        });

        // 4. Train Nearest Centroid Classifier: Compute category centroids
        const categoryVectors = {};
        queries.forEach((q, idx) => {
            const cat = q.query_type;
            if (!categoryVectors[cat]) categoryVectors[cat] = [];
            categoryVectors[cat].push(this.docVectors[idx].vector);
        });

        for (const [cat, vectors] of Object.entries(categoryVectors)) {
            const centroid = new Map();
            // Sum all normalized vectors in the category
            vectors.forEach(vec => {
                for (const [word, val] of vec.entries()) {
                    centroid.set(word, (centroid.get(word) || 0) + val);
                }
            });

            // Normalize centroid vector
            let sumSq = 0;
            for (const val of centroid.values()) {
                sumSq += val * val;
            }
            const norm = Math.sqrt(sumSq);
            if (norm > 0) {
                for (const [word, val] of centroid.entries()) {
                    centroid.set(word, val / norm);
                }
            }
            this.centroids[cat] = centroid;
        }

        console.log(`AI Engine initialized with ${N} documents. Vocabulary size: ${this.vocabulary.size}`);
    }

    // Vectorize a query string
    vectorizeQuery(tokens) {
        const tf = {};
        tokens.forEach(token => {
            tf[token] = (tf[token] || 0) + 1;
        });

        const vector = new Map();
        let sumSq = 0;

        for (const [word, count] of Object.entries(tf)) {
            if (this.idf[word]) {
                const weight = count * this.idf[word];
                vector.set(word, weight);
                sumSq += weight * weight;
            }
        }

        const norm = Math.sqrt(sumSq);
        if (norm > 0) {
            for (const [word, weight] of vector.entries()) {
                vector.set(word, weight / norm);
            }
        }

        return vector;
    }

    // Compute dot product of two normalized Map vectors
    dotProduct(vecA, vecB) {
        let dot = 0;
        // Iterate through the smaller vector for speed
        if (vecA.size < vecB.size) {
            for (const [word, valA] of vecA.entries()) {
                if (vecB.has(word)) {
                    dot += valA * vecB.get(word);
                }
            }
        } else {
            for (const [word, valB] of vecB.entries()) {
                if (vecA.has(word)) {
                    dot += valB * vecA.get(word);
                }
            }
        }
        return dot;
    }

    // Retrieve Top K similar queries
    retrieve(queryString, k = 5) {
        const tokens = this.tokenize(queryString);
        if (tokens.length === 0) return [];

        const queryVector = this.vectorizeQuery(tokens);
        if (queryVector.size === 0) return [];

        const scores = [];
        this.docVectors.forEach(doc => {
            const similarity = this.dotProduct(queryVector, doc.vector);
            if (similarity > 0) {
                scores.push({
                    index: doc.index,
                    score: similarity,
                    query: this.queries[doc.index]
                });
            }
        });

        // Sort descending by score
        scores.sort((a, b) => b.score - a.score);
        return scores.slice(0, k);
    }

    // Classify query intent using nearest centroid similarity
    classify(queryString) {
        const tokens = this.tokenize(queryString);
        if (tokens.length === 0) {
            return { category: 'Market Rates & Info', confidence: 0.1, matchingTerms: [] };
        }

        const queryVector = this.vectorizeQuery(tokens);
        if (queryVector.size === 0) {
            return { category: 'Market Rates & Info', confidence: 0.1, matchingTerms: [] };
        }

        let bestCategory = '';
        let maxSimilarity = -1;
        const allSimilarities = {};

        for (const [cat, centroid] of Object.entries(this.centroids)) {
            const sim = this.dotProduct(queryVector, centroid);
            allSimilarities[cat] = sim;
            if (sim > maxSimilarity) {
                maxSimilarity = sim;
                bestCategory = cat;
            }
        }

        // Calculate confidence percentage
        let sumSim = 0;
        for (const sim of Object.values(allSimilarities)) {
            sumSim += Math.max(0, sim);
        }
        
        let confidence = 0.5;
        if (sumSim > 0 && maxSimilarity > 0) {
            // Ratio of best score to sum of positive scores
            confidence = maxSimilarity / sumSim;
            // Scale and cap
            confidence = Math.min(0.98, Math.max(0.40, confidence + 0.15));
        }

        // Extract which keywords contributed to the decision
        const matchingTerms = tokens.filter(token => this.idf[token] !== undefined);

        return {
            category: bestCategory || 'Market Rates & Info',
            confidence: Math.round(confidence * 100),
            matchingTerms: matchingTerms.slice(0, 5)
        };
    }
}

// Instantiate globally
const aiEngine = new AgriNLP();
