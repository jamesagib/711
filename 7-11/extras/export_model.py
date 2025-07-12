import json
import pickle
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.svm import LinearSVC
from sklearn.pipeline import make_pipeline

# Load the data
with open('new_data.json', 'r') as f:
    all_videos = json.load(f)

# Prepare the data
texts = [video['title'] + ' ' + video['description'] for video in all_videos]
labels = [video['label'] for video in all_videos]

# Create and fit the model
model = make_pipeline(TfidfVectorizer(), LinearSVC())
model.fit(texts, labels)

# Extract model parameters
tfidf = model.named_steps['tfidfvectorizer']
svm = model.named_steps['linearsvc']

# Export TF-IDF parameters
tfidf_params = {
    'vocabulary_': dict(tfidf.vocabulary_),
    'idf_': tfidf.idf_.tolist(),
    'stop_words': tfidf.stop_words,
    'lowercase': tfidf.lowercase,
    'max_df': tfidf.max_df,
    'min_df': tfidf.min_df,
    'ngram_range': tfidf.ngram_range,
    'token_pattern': tfidf.token_pattern,
    'analyzer': tfidf.analyzer,
    'use_idf': tfidf.use_idf,
    'smooth_idf': tfidf.smooth_idf,
    'sublinear_tf': tfidf.sublinear_tf,
    'norm': tfidf.norm
}

# Export SVM parameters
svm_params = {
    'coef_': svm.coef_.tolist(),
    'intercept_': svm.intercept_.tolist(),
    'classes_': svm.classes_.tolist()
}

# Combine all parameters
export_data = {
    'tfidf_params': tfidf_params,
    'svm_params': svm_params,
    'labels': list(set(labels))  # Unique labels
}

# Save to JSON file
with open('model_paramsv2.json', 'w') as f:
    json.dump(export_data, f, indent=2)

print("Model exported to model_params.json")
print(f"Labels: {export_data['labels']}")

# Test the export
test_text = "BUILDING A £400,000 MCLAREN FROM TEMU"
prediction = model.predict([test_text])[0]
print(f"Test prediction for '{test_text}': {prediction}") 