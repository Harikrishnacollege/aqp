import pandas as pd


def execute_query(df: pd.DataFrame, parsed: dict, sample_fraction: float):
    """
    Executes a parsed query on the dataframe with uniform scaling.
    Used for simple random sampling and exact queries.
    """
    scale = 1.0 / sample_fraction if sample_fraction < 1.0 else 1.0
    agg = parsed["aggregation"]
    col = parsed.get("agg_col")
    group_by = parsed.get("group_by")

    if group_by:
        grouped = df.groupby(group_by)
        if agg == "count":
            result = (grouped.size() * scale).round().astype(int)
        elif agg == "sum":
            result = (grouped[col].sum() * scale).round(2)
        elif agg == "avg":
            result = grouped[col].mean().round(4)
        return result.to_dict()
    else:
        if agg == "count":
            return int(len(df) * scale)
        elif agg == "sum":
            return round(df[col].sum() * scale, 2)
        elif agg == "avg":
            return round(df[col].mean(), 4)


def execute_stratified_query(df: pd.DataFrame, parsed: dict, strata_info: dict):
    """
    Executes a query using per-group weights from stratified sampling.
    Each group is scaled by its own weight (total/sampled), giving
    much more accurate GROUP BY results than uniform scaling.
    """
    agg = parsed["aggregation"]
    col = parsed.get("agg_col")
    group_by = parsed.get("group_by")

    if not group_by or not strata_info:
        # Fall back to uniform scaling for non-GROUP BY queries
        avg_weight = sum(v["weight"] for v in strata_info.values()) / len(strata_info) if strata_info else 1.0
        if agg == "count":
            return int(len(df) * avg_weight)
        elif agg == "sum":
            return round(df[col].sum() * avg_weight, 2)
        elif agg == "avg":
            return round(df[col].mean(), 4)

    result = {}
    for name, group in df.groupby(group_by):
        info = strata_info.get(name, {"weight": 1.0})
        w = info["weight"]
        if agg == "count":
            result[name] = int(round(len(group) * w))
        elif agg == "sum":
            result[name] = round(group[col].sum() * w, 2)
        elif agg == "avg":
            result[name] = round(group[col].mean(), 4)

    return result
