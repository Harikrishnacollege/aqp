"""
Run this once to generate the dataset before starting the server.
Usage: python generate_data.py
"""
import pandas as pd
import numpy as np
import os

n = 1_000_000

print(f"Generating {n:,} rows...")

np.random.seed(42)
df = pd.DataFrame({
    "user_id": np.arange(n),
    "region": np.random.choice(["India", "US", "EU", "APAC", "LATAM"], n, p=[0.3, 0.25, 0.2, 0.15, 0.1]),
    "product": np.random.choice(["Phone", "Laptop", "Tablet", "Watch", "Headphones"], n),
    "category": np.random.choice(["Electronics", "Fashion", "Home", "Sports", "Books"], n),
    "price": np.round(np.random.exponential(scale=300, size=n).clip(5, 2000), 2),
    "quantity": np.random.randint(1, 10, n),
    "revenue": None,
    "clicked": np.random.randint(0, 2, n),
})

df["revenue"] = np.round(df["price"] * df["quantity"], 2)

out_path = os.path.join(os.path.dirname(__file__), "data", "dataset.csv")
os.makedirs(os.path.dirname(out_path), exist_ok=True)
df.to_csv(out_path, index=False)

print(f"✅ Dataset saved to {out_path}")
print(f"   Shape: {df.shape}")
print(df.head(3))
