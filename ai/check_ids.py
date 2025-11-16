from pymongo import MongoClient

c = MongoClient('mongodb://localhost:27017')
p = c['value_scout']['products']

print('Sample product IDs:')
for doc in p.find().limit(10):
    print(f'  {doc["_id"]}')
