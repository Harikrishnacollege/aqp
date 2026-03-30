from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import time
import os
from engine.sampler import sample_data, stratified_sample, STRATIFY_COLS
from engine.query_parser import parse_query
from engine.executor import execute_query, execute_stratified_query
from engine.error_estimator import compute_error

app = FastAPI(title="AQP Engine API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_PATH = os.path.join(os.path.dirname(__file__), "data", "dataset.csv")
df = None


@app.on_event("startup")
def load_data():
    global df
    if not os.path.exists(DATA_PATH):
        print("Dataset not found! Run generate_data.py first.")
    else:
        df = pd.read_csv(DATA_PATH)
        print(f"Loaded dataset with {len(df):,} rows.")


@app.get("/")
def root():
    return {"message": "AQP Engine is running!", "rows": len(df) if df is not None else 0}


@app.post("/query")
def run_query(query: str, sample_fraction: float = 0.1, use_stratified: bool = False):
    global df
    if df is None:
        return {"error": "Dataset not loaded"}

    parsed = parse_query(query)
    if "error" in parsed:
        return parsed

    group_by = parsed.get("group_by")
    can_stratify = use_stratified and group_by and group_by in STRATIFY_COLS

    # --- Approximate ---
    if can_stratify:
        sampled_df, strata_info = stratified_sample(df, sample_fraction, group_by)
        t0 = time.perf_counter()
        approx_result = execute_stratified_query(sampled_df, parsed, strata_info)
        approx_time = (time.perf_counter() - t0) * 1000
    else:
        sampled_df = sample_data(df, sample_fraction)
        strata_info = {}
        t0 = time.perf_counter()
        approx_result = execute_query(sampled_df, parsed, sample_fraction)
        approx_time = (time.perf_counter() - t0) * 1000

    # --- Exact ---
    t1 = time.perf_counter()
    exact_result = execute_query(df, parsed, 1.0)
    exact_time = (time.perf_counter() - t1) * 1000

    speedup = round(exact_time / approx_time, 2) if approx_time > 0 else 0
    error_pct = compute_error(approx_result, exact_result, parsed)

    return {
        "query": query,
        "parsed": parsed,
        "sample_fraction": sample_fraction,
        "sampling_method": "stratified" if can_stratify else "random",
        "rows_scanned": len(sampled_df),
        "total_rows": len(df),
        "approx_result": approx_result,
        "exact_result": exact_result,
        "approx_time_ms": round(approx_time, 3),
        "exact_time_ms": round(exact_time, 3),
        "speedup": speedup,
        "error_pct": error_pct,
        "strata_info": strata_info if can_stratify else {},
    }


@app.get("/benchmark")
def benchmark(query: str = "SELECT COUNT(*) FROM data GROUP BY region"):
    global df
    if df is None:
        return {"error": "Dataset not loaded"}

    fractions = [0.01, 0.05, 0.1, 0.2, 0.5, 1.0]
    parsed = parse_query(query)
    group_by = parsed.get("group_by")
    can_stratify = group_by and group_by in STRATIFY_COLS

    exact_result = execute_query(df, parsed, 1.0)
    t_exact = time.perf_counter()
    execute_query(df, parsed, 1.0)
    exact_time = (time.perf_counter() - t_exact) * 1000

    results = []
    for frac in fractions:
        # Random
        sampled = sample_data(df, frac)
        t0 = time.perf_counter()
        approx_random = execute_query(sampled, parsed, frac)
        t_random = (time.perf_counter() - t0) * 1000

        # Stratified
        if can_stratify:
            s_df, s_info = stratified_sample(df, frac, group_by)
            t1 = time.perf_counter()
            approx_strat = execute_stratified_query(s_df, parsed, s_info)
            t_strat = (time.perf_counter() - t1) * 1000
        else:
            approx_strat = approx_random
            t_strat = t_random

        results.append({
            "fraction": frac,
            "time_ms": round(t_random, 3),
            "speedup": round(exact_time / t_random, 2) if t_random > 0 else 0,
            "error_random": compute_error(approx_random, exact_result, parsed),
            "error_stratified": compute_error(approx_strat, exact_result, parsed),
        })

    return {"benchmark": results, "can_stratify": can_stratify}
