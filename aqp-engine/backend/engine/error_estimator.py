def compute_error(approx, exact, parsed) -> float:
    """
    Computes mean absolute percentage error between approx and exact results.
    Handles both scalar and dict (GROUP BY) results.
    """
    try:
        if isinstance(exact, dict) and isinstance(approx, dict):
            errors = []
            for key in exact:
                if key in approx:
                    e = exact[key]
                    a = approx[key]
                    if e != 0:
                        errors.append(abs(a - e) / abs(e) * 100)
            return round(sum(errors) / len(errors), 2) if errors else 0.0

        elif isinstance(exact, (int, float)) and isinstance(approx, (int, float)):
            if exact == 0:
                return 0.0
            return round(abs(approx - exact) / abs(exact) * 100, 2)

    except Exception:
        pass

    return 0.0
