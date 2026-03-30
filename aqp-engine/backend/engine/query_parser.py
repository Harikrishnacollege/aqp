import re

NUMERIC_COLS = ["price", "quantity", "revenue", "clicked"]
GROUPABLE_COLS = ["region", "product", "category", "clicked"]

def parse_query(query: str) -> dict:
    """
    Parses a simplified SQL-like query string.
    Supported: COUNT(*), SUM(col), AVG(col) with optional GROUP BY col
    """
    q = query.lower().strip()

    # Detect aggregation
    agg = None
    agg_col = None

    if re.search(r"count\s*\(", q):
        agg = "count"
        agg_col = None
    elif m := re.search(r"sum\s*\((\w+)\)", q):
        agg = "sum"
        agg_col = m.group(1)
    elif m := re.search(r"avg\s*\((\w+)\)", q):
        agg = "avg"
        agg_col = m.group(1)

    if agg is None:
        return {"error": f"Unsupported query. Use COUNT(*), SUM(col), or AVG(col). Got: {query}"}

    # Validate agg_col
    if agg in ("sum", "avg") and agg_col not in NUMERIC_COLS:
        return {"error": f"Column '{agg_col}' not found. Available: {NUMERIC_COLS}"}

    # Detect GROUP BY
    group_by = None
    if m := re.search(r"group\s+by\s+(\w+)", q):
        group_by = m.group(1)
        if group_by not in GROUPABLE_COLS:
            return {"error": f"Cannot group by '{group_by}'. Available: {GROUPABLE_COLS}"}

    return {
        "aggregation": agg,
        "agg_col": agg_col,
        "group_by": group_by,
    }
