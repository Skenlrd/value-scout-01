"""
CLIP-based Style Embedding Generator
Generates multi-modal embeddings for products without styleEmbedding
Uses: 70% image embedding + 30% text embedding
"""

from sentence_transformers import SentenceTransformer
from pymongo import MongoClient
from PIL import Image
import requests
from io import BytesIO
import numpy as np

# MongoDB Connection
client = MongoClient("mongodb://localhost:27017/")
db = client["value_scout"]
products_collection = db["products"]

# Load CLIP Model
print("🔄 Loading CLIP model (clip-ViT-B-32)...")
model = SentenceTransformer("clip-ViT-B-32")
print("✅ Model loaded successfully\n")

def download_image(image_url):
    """Download image from URL and convert to PIL Image"""
    try:
        # Handle protocol-relative URLs
        if image_url.startswith("//"):
            image_url = "https:" + image_url
        
        # Add timeout and headers
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
        response = requests.get(image_url, timeout=10, headers=headers)
        response.raise_for_status()
        
        # Convert to PIL Image
        image = Image.open(BytesIO(response.content))
        
        # Convert to RGB if needed
        if image.mode != "RGB":
            image = image.convert("RGB")
        
        return image
    except Exception as e:
        print(f"   ⚠️  Image download failed: {e}")
        return None

def generate_style_embedding(product_name, image_url):
    """
    Generate combined style embedding
    70% image + 30% text
    """
    try:
        # Download image
        image = download_image(image_url)
        if image is None:
            return None
        
        # Generate image embedding
        image_embedding = model.encode(image, convert_to_numpy=True)
        
        # Generate text embedding
        text_embedding = model.encode(product_name, convert_to_numpy=True)
        
        # Combine: 70% image + 30% text
        combined_embedding = (image_embedding * 0.7) + (text_embedding * 0.3)
        
        # Convert to Python list for MongoDB
        embedding_list = combined_embedding.tolist()
        
        return embedding_list
        
    except Exception as e:
        print(f"   ❌ Embedding generation failed: {e}")
        return None

def process_all_embeddings():
    """
    Process all products without styleEmbedding
    Uses cursor to avoid memory issues
    """
    print("="*60)
    print("🚀 STARTING EMBEDDING GENERATION")
    print("="*60)
    
    # Count total products to process
    total_count = products_collection.count_documents({
        "styleEmbedding": {"$exists": False}
    })
    
    if total_count == 0:
        print("\n✅ All products already have embeddings!")
        return
    
    print(f"\n📊 Found {total_count} products without embeddings\n")
    
    # Use cursor to iterate (memory efficient)
    cursor = products_collection.find(
        {"styleEmbedding": {"$exists": False}},
        {"_id": 1, "productName": 1, "imageUrl": 1, "brand": 1}
    )
    
    processed = 0
    successful = 0
    failed = 0
    
    for product in cursor:
        product_id = product.get("_id")
        product_name = product.get("productName", "Unnamed Product")
        image_url = product.get("imageUrl", "")
        brand = product.get("brand", "Unknown")
        
        # Progress indicator
        processed += 1
        print(f"[{processed}/{total_count}] Processing: {product_name[:50]}...")
        
        # Skip if no image URL
        if not image_url:
            print(f"   ⚠️  No image URL - skipped")
            failed += 1
            continue
        
        # Generate embedding
        try:
            embedding = generate_style_embedding(product_name, image_url)
            
            if embedding is None:
                failed += 1
                continue
            
            # Save to database
            products_collection.update_one(
                {"_id": product_id},
                {"$set": {"styleEmbedding": embedding}}
            )
            
            successful += 1
            print(f"   ✅ Saved embedding (dim: {len(embedding)})")
            
        except Exception as e:
            print(f"   ❌ Error: {e}")
            failed += 1
            continue
    
    # Final summary
    print("\n" + "="*60)
    print("📊 EMBEDDING GENERATION COMPLETE")
    print("="*60)
    print(f"Total processed:  {processed}")
    print(f"Successful:       {successful}")
    print(f"Failed:           {failed}")
    print(f"Success rate:     {(successful/processed*100):.1f}%")
    print("="*60)
    
    print(f"\n✅ All embeddings generated. {successful} products ready for AI recommendations!")

if __name__ == "__main__":
    process_all_embeddings()
