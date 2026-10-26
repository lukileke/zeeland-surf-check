#!/usr/bin/env python3
"""FARO research-only real NOAA buoy pretraining (NOT local surf quality).

Learn an observational 3h significant wave-height tendency from NOAA NDBC
stations using only *past* measured values. Benchmarks persistence and a
constant baseline on chronologically held-out future hours. No synthetic
labels, no webcam footage, no deployment to website. All identifiers, units,
dates and metrics are saved for audit.
"""
from __future__ import annotations
import argparse
import datetime as dt
import json
import math
import statistics
import urllib.request
from pathlib import Path

STATIONS = ("46026", "46042")
HORIZON_HOURS = 3
FEATURES = ("height_t", "height_minus1h", "height_minus2h", "height_minus3h",
            "period_t", "wind_t", "sin_swell_from", "cos_swell_from",
            "sin_wind_from", "cos_wind_from")
UTC = dt.timezone.utc


def valid_float(raw: str, low: float, high: float) -> float | None:
    if raw in {"MM", "99", "999", "9999", "999.0", "-999", "-9999"}:
        return None
    try:
        value = float(raw)
        return value if math.isfinite(value) and low <= value <= high else None
    except (ValueError, TypeError):
        return None


def parse_ndbc(content: str) -> dict[dt.datetime, dict]:
    """NOAA realtime2 text includes two header lines and ragged MM fields."""
    lines = content.splitlines()
    if not lines or "WVHT" not in lines[0]:
        raise ValueError("NDBC header does not include WVHT")
    header = lines[0].lstrip("#").split()
    if header[0] not in {"YY", "YYYY"}:
        raise ValueError("Unknown date-header schema")
    required = ("WVHT", "APD", "WSPD", "WDIR", "MWD")
    if not all(field in header for field in required):
        raise ValueError("One or more wave/meteorological columns missing")
    buckets: dict[dt.datetime, dict[str, list[float]]] = {}
    for raw in lines[2:]:
        p = raw.split()
        if len(p) < len(header):
            continue
        fields = dict(zip(header, p))
        try:
            year = int(fields[header[0]])
            if year < 100:
                year += 2000
            instant = dt.datetime(year, int(fields["MM"]), int(fields["DD"]),
                                  int(fields["hh"]), int(fields["mm"]), tzinfo=UTC)
        except (ValueError, KeyError):
            continue
        h = instant.replace(minute=0, second=0, microsecond=0)
        b = buckets.setdefault(h, {name: [] for name in required})
        for key, low, high in [("WVHT", 0, 20), ("APD", 2, 30),
                               ("WSPD", 0, 75), ("WDIR", 0, 360),
                               ("MWD", 0, 360)]:
            v = valid_float(fields[key], low, high)
            if v is not None:
                b[key].append(v)
    # Use circular means for directions to respect wraparound at 360 deg.
    out = {}
    for hour, b in buckets.items():
        values = {}
        for key, obs in b.items():
            if not obs:
                values[key] = None
            elif key in ("WDIR", "MWD"):
                u = sum(math.cos(math.radians(x)) for x in obs)
                v = sum(math.sin(math.radians(x)) for x in obs)
                values[key] = (math.degrees(math.atan2(v, u)) + 360) % 360
            else:
                values[key] = statistics.median(obs)
        out[hour] = values
    return out


def examples(hourly: dict) -> list[tuple[dt.datetime, list[float], float]]:
    rows = []
    step = dt.timedelta(hours=1)
    for t in sorted(hourly):
        cur = hourly[t]
        prev = [hourly.get(t - step * i) for i in range(4)]
        fut = hourly.get(t + step * HORIZON_HOURS)
        if any(v is None for v in prev) or fut is None:
            continue
        heights = [v["WVHT"] for v in prev]
        needed = heights + [cur[key] for key in ("APD", "WSPD", "WDIR", "MWD")] + [fut["WVHT"]]
        if any(v is None for v in needed):
            continue
        wdir = math.radians(cur["WDIR"])
        sdir = math.radians(cur["MWD"])
        x = [*heights, cur["APD"], cur["WSPD"],
             math.sin(sdir), math.cos(sdir), math.sin(wdir), math.cos(wdir)]
        rows.append((t, x, fut["WVHT"]))
    return rows


def solve(A, y):
    n = len(y)
    z = [list(row) + [v] for row, v in zip(A, y)]
    for col in range(n):
        pivot = max(range(col, n), key=lambda i: abs(z[i][col]))
        if abs(z[pivot][col]) < 1e-11:
            raise ValueError("Singular ridge system")
        z[col], z[pivot] = z[pivot], z[col]
        factor = z[col][col]
        z[col] = [v / factor for v in z[col]]
        for i in range(n):
            if i == col:
                continue
            k = z[i][col]
            if k:
                z[i] = [a - k * b for a, b in zip(z[i], z[col])]
    return [z[i][-1] for i in range(n)]


def fit(rows, strength: float) -> dict:
    n = len(rows)
    dim = len(FEATURES)
    center = [statistics.mean(row[1][j] for row in rows) for j in range(dim)]
    scale = [statistics.pstdev(row[1][j] for row in rows) or 1. for j in range(dim)]
    dim += 1
    A = [[0. for _ in range(dim)] for _ in range(dim)]
    rhs = [0.] * dim
    for _, x, label in rows:
        v = [1.] + [(w - center[j]) / scale[j] for j, w in enumerate(x)]
        for i in range(dim):
            rhs[i] += v[i] * label
            for j in range(dim):
                A[i][j] += v[i] * v[j]
    for j in range(1, dim):
        A[j][j] += strength
    return {"coefficients": solve(A, rhs), "center": center, "scale": scale,
            "regularisation": strength}


def predict(model, row):
    x = row[1]
    z = model["coefficients"][0] + sum(
        model["coefficients"][j + 1] * (v - model["center"][j]) / model["scale"][j]
        for j, v in enumerate(x))
    return max(0., z)


def metrics(rows, predictions):
    obs = [v[2] for v in rows]
    return {"MAE_m": round(statistics.mean(abs(a - b) for a, b in zip(obs, predictions)), 4),
            "RMSE_m": round(math.sqrt(statistics.mean((a - b)**2 for a, b in zip(obs, predictions))), 4)}


def learn(raw: str, station: str, retrieved: str) -> dict:
    hourly = parse_ndbc(raw)
    rows = examples(hourly)
    result = {"schemaVersion": "1.0.0", "stationId": station,
              "source": f"https://www.ndbc.noaa.gov/data/realtime2/{station}.txt",
              "dataSource": "NOAA NDBC observation, not forecast",
              "retrievedAtUtc": retrieved,
              "target": "observed WVHT at +3 h (m)",
              "horizonHours": HORIZON_HOURS, "sampleHours": len(hourly),
              "usableSupervisedExamples": len(rows),
              "researchOnly": True, "deployed": False,
              "surfQualityValidated": False, "cameraModelTrained": False,
              "notes": "Observational autoregression at US buoy; not Chile and not breaking-wave surfability"}
    if len(rows) < 180:
        return dict(result, status="insufficient_real_samples")
    n = len(rows)
    a = int(.65 * n)
    b = int(.80 * n)
    # Drop 24-hour blocks at cutoffs to reduce temporal leakage from storm episodes.
    train = rows[:max(0, a - 24)]
    val = rows[min(n, a + 24):max(a + 24, b - 24)]
    hold = rows[min(n, b + 24):]
    if min(len(train), len(val), len(hold)) < 30:
        return dict(result, status="insufficient_chronological_holdout")
    choices = [(metrics(val, [predict(fit(train, lam), r) for r in val])["MAE_m"], lam)
               for lam in (.1, 1., 10., 50., 100.)]
    _, strength = min(choices)
    final = fit(train + val, strength)
    prediction = [predict(final, row) for row in hold]
    persistence = [row[1][0] for row in hold]
    constant = [statistics.mean(x[2] for x in train + val)] * len(hold)
    result.update(status="real_buoy_model_trained", features=FEATURES,
                  trainExamples=len(train), validationExamples=len(val),
                  holdoutExamples=len(hold),
                  trainLastAtUtc=train[-1][0].isoformat(),
                  holdoutFirstAtUtc=hold[0][0].isoformat(),
                  holdoutLastAtUtc=hold[-1][0].isoformat(),
                  ridge=metrics(hold, prediction),
                  persistence=metrics(hold, persistence),
                  constant=metrics(hold, constant),
                  beatsPersistence=metrics(hold, prediction)["MAE_m"] <
                                    metrics(hold, persistence)["MAE_m"],
                  model=final)
    return result


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--output", type=Path, default=Path("research-data/buoys/observed-height-model.json"))
    args = parser.parse_args()
    results = []
    for station in STATIONS:
        url = f"https://www.ndbc.noaa.gov/data/realtime2/{station}.txt"
        with urllib.request.urlopen(urllib.request.Request(
                url, headers={"User-Agent": "FARO research comparison (personal noncommercial)"}),
                timeout=35) as handle:
            raw = handle.read(1_500_001).decode("utf-8")
            if len(raw) > 1_500_000:
                raise RuntimeError("Unexpectedly large NOAA data")
        results.append(learn(raw, station, dt.datetime.now(UTC).isoformat()))
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps({"models": results}, indent=2) + "\n", encoding="utf8")
    for r in results:
        print(r["stationId"], r["status"], "n", r["usableSupervisedExamples"],
              "ridge", r.get("ridge"), "persistence", r.get("persistence"))


if __name__ == "__main__":
    main()
