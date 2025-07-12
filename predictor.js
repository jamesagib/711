// YouTube Video Category Predictor
// Uses TF-IDF vectorization and SVM classification

class VideoCategoryPredictor {
    constructor() {
        this.modelParams = null;
        this.isLoaded = false;
    }

    // Load model parameters from JSON file
    async loadModel(modelPath = 'model_params.json') {
        try {
            const response = await fetch(modelPath);
            this.modelParams = await response.json();
            this.isLoaded = true;
            console.log('Model loaded successfully');
            console.log('Available categories:', this.modelParams.labels);
        } catch (error) {
            console.error('Error loading model:', error);
            throw error;
        }
    }

    // Tokenize text (simple word-based tokenization)
    tokenize(text) {
        // Convert to lowercase and split by whitespace
        return text.toLowerCase()
            .replace(/[^\w\s]/g, ' ') // Replace punctuation with spaces
            .split(/\s+/)
            .filter(token => token.length > 0);
    }

    // Extract n-grams (unigrams and bigrams)
    extractNgrams(tokens, ngramRange = [1, 2]) {
        const ngrams = [];
        
        // Unigrams
        if (ngramRange[0] <= 1 && ngramRange[1] >= 1) {
            ngrams.push(...tokens);
        }
        
        // Bigrams
        if (ngramRange[0] <= 2 && ngramRange[1] >= 2) {
            for (let i = 0; i < tokens.length - 1; i++) {
                ngrams.push(tokens[i] + ' ' + tokens[i + 1]);
            }
        }
        
        return ngrams;
    }

    // Calculate TF-IDF features
    calculateTfIdf(text) {
        const tfidfParams = this.modelParams.tfidf_params;
        const vocabulary = tfidfParams.vocabulary_;
        const idf = tfidfParams.idf_;
        
        // Tokenize and extract n-grams
        const tokens = this.tokenize(text);
        const ngrams = this.extractNgrams(tokens, tfidfParams.ngram_range);
        
        // Count term frequencies
        const termFreq = {};
        ngrams.forEach(ngram => {
            termFreq[ngram] = (termFreq[ngram] || 0) + 1;
        });
        
        // Calculate TF-IDF scores
        const tfidfScores = {};
        const numTerms = ngrams.length;
        
        Object.keys(termFreq).forEach(term => {
            if (vocabulary.hasOwnProperty(term)) {
                const tf = termFreq[term] / numTerms;
                const idfScore = idf[vocabulary[term]];
                tfidfScores[vocabulary[term]] = tf * idfScore;
            }
        });
        
        return tfidfScores;
    }

    // Make prediction using SVM
    predict(text) {
        if (!this.isLoaded) {
            throw new Error('Model not loaded. Call loadModel() first.');
        }

        // Calculate TF-IDF features
        const features = this.calculateTfIdf(text);
        
        // Get SVM parameters
        const svmParams = this.modelParams.svm_params;
        const coef = svmParams.coef_;
        const intercept = svmParams.intercept_;
        const classes = svmParams.classes_;
        
        // Calculate decision scores for each class
        const scores = new Array(classes.length).fill(0);
        
        // For each class, calculate the decision score
        for (let i = 0; i < classes.length; i++) {
            let score = intercept[i];
            
            // Add contribution from each feature
            Object.keys(features).forEach(featureIndex => {
                const featureIdx = parseInt(featureIndex);
                if (featureIdx < coef[i].length) {
                    score += coef[i][featureIdx] * features[featureIndex];
                }
            });
            
            scores[i] = score;
        }
        
        // Find the class with the highest score
        let maxScore = scores[0];
        let predictedClass = classes[0];
        
        for (let i = 1; i < scores.length; i++) {
            if (scores[i] > maxScore) {
                maxScore = scores[i];
                predictedClass = classes[i];
            }
        }
        
        return {
            category: predictedClass,
            confidence: this.calculateConfidence(scores),
            scores: scores.map((score, index) => ({
                category: classes[index],
                score: score
            }))
        };
    }

    // Calculate confidence based on score differences
    calculateConfidence(scores) {
        const maxScore = Math.max(...scores);
        const sortedScores = [...scores].sort((a, b) => b - a);
        const scoreDiff = maxScore - sortedScores[1]; // Difference between top 2 scores
        
        // Normalize confidence (0-1 scale)
        const confidence = Math.min(scoreDiff / 2 + 0.5, 1.0);
        return Math.round(confidence * 100) / 100;
    }

    // Get all available categories
    getCategories() {
        return this.modelParams ? this.modelParams.labels : [];
    }

    // Check if model is loaded
    isModelLoaded() {
        return this.isLoaded;
    }
}

// Example usage and testing
async function testPredictor() {
    const predictor = new VideoCategoryPredictor();
    
    try {
        // Load the model
        await predictor.loadModel('../extras/model_paramsv2.json');
        
        // Test predictions
        const testCases = [
            "BUILDING A £400,000 MCLAREN FROM TEMU",
            "How to learn JavaScript in 2024",
            "Best study techniques for exams",
            "Funny cat compilation 2024",
            "Motivational speech for success",
            "Gaming setup tour 2024"
        ];
        
        console.log('Testing predictions:');
        testCases.forEach(text => {
            const result = predictor.predict(text);
            console.log(`"${text}" -> ${result.category} (confidence: ${result.confidence})`);
        });
        
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = VideoCategoryPredictor;
} else {
    // Browser environment
    window.VideoCategoryPredictor = VideoCategoryPredictor;
}

// Run test if this file is executed directly
if (typeof window === 'undefined') {
    testPredictor();
} 