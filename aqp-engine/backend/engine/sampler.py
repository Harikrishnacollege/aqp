import pandas as pd

STRATIFY_COLS = ["region", "product", "category"]


def sample_data(df: pd.DataFrame, fraction: float, seed: int = 42) -> pd.DataFrame:
    """Simple random sampling."""
    if fraction >= 1.0:
        return df
    return df.sample(frac=fraction, random_state=seed)


def stratified_sample(df: pd.DataFrame, fraction: float, strata_col: str, seed: int = 42):
    """
    Stratified sampling: each group in strata_col is sampled at the same
    fraction, guaranteeing proportional representation.

    Returns:
        sampled_df  - the stratified sample DataFrame
        strata_info - dict {group: {"sampled": n, "total": N, "weight": w}}
    """
    if fraction >= 1.0:
        return df, {}

    groups = df.groupby(strata_col)
    parts = []
    strata_info = {}

    for name, group in groups:
        n_total = len(group)
        n_sample = max(1, round(n_total * fraction))
        sampled = group.sample(n=n_sample, random_state=seed)
        parts.append(sampled)
        strata_info[name] = {
            "sampled": n_sample,
            "total": n_total,
            "weight": n_total / n_sample,
        }

    return pd.concat(parts), strata_info
