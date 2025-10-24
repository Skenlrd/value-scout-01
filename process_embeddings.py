# process_embeddings.py
from pymongo import MongoClient
from sentence_transformers import SentenceTransformer
from PIL import Image
import requests
from io import BytesIO
import numpy as np

# Connect to MongoDB
client = MongoClient('mongodb://localhost:27017/')
db = client['value_scout']
products_collection = db['products']

# Load CLIP model
print("Loading CLIP model...")
model = SentenceTransformer('clip-ViT-B-32')
print("Model loaded!")

def process_product(product):
    """Generate embedding for a single product"""
    try:
        print(f"\nProcessing: {product['productName']}")
        
        # Download image
        response = requests.get(product['imageUrl'], timeout=10)
        img = Image.open(BytesIO(response.content)).convert('RGB')
        
        # Generate image embedding
        image_embedding = model.encode(img, convert_to_numpy=True)
        
        # Generate text embedding
        text_embedding = model.encode(product['productName'], convert_to_numpy=True)
        
        # Combine embeddings (70% image, 30% text)
        combined_embedding = (0.7 * image_embedding + 0.3 * text_embedding)
        
        # Normalize
        combined_embedding = combined_embedding / np.linalg.norm(combined_embedding)
        
        # Convert to list for MongoDB
        embedding_list = combined_embedding.tolist()
        
        # Update in database
        products_collection.update_one(
            {'_id': product['_id']},
            {'$set': {'styleEmbedding': embedding_list}}
        )
        
        print(f"✓ Generated embedding for: {product['productName']}")
        return True
        
    except Exception as e:
        print(f"✗ Error processing {product['productName']}: {str(e)}")
        return False

def main():
    # Find products without embeddings
    products = list(products_collection.find({'styleEmbedding': {'$exists': False}}))
    
    if not products:
        print("No products need processing!")
        return
    
    print(f"Found {len(products)} products to process\n")
    
    success_count = 0
    for product in products:
        if process_product(product):
            success_count += 1
    
    print(f"\n✓ Processing complete! {success_count}/{len(products)} successful")

if __name__ == "__main__":
    main()
