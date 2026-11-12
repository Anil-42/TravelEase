import concurrent.futures
import http.client
import json
import os
import statistics
import time
import urllib.parse

HOST = os.environ.get("LOAD_HOST", "localhost")
PORT = int(os.environ.get("LOAD_PORT", "8080"))
VIRTUAL_USERS = int(os.environ.get("LOAD_VUS", "150"))
DURATION_SECONDS = int(os.environ.get("LOAD_DURATION", "20"))

TEST_USER_EMAIL = os.environ.get("LOAD_USER_EMAIL", "")
TEST_USER_PASSWORD = os.environ.get("LOAD_USER_PASSWORD", "")
ADMIN_EMAIL = os.environ.get("LOAD_ADMIN_EMAIL", "")
ADMIN_PASSWORD = os.environ.get("LOAD_ADMIN_PASSWORD", "")


def login_and_get_token(email, password):
    if not email or not password:
        return None
    conn = http.client.HTTPConnection(HOST, PORT, timeout=10)
    payload = json.dumps({"email": email, "password": password})
    conn.request("POST", "/api/auth/login", body=payload, headers={"Content-Type": "application/json"})
    resp = conn.getresponse()
    body = resp.read().decode("utf-8", errors="replace")
    conn.close()
    if resp.status == 200:
        return json.loads(body).get("token")
    return None


def percentile(sorted_vals, p):
    if not sorted_vals:
        return 0.0
    k = (len(sorted_vals) - 1) * (p / 100.0)
    f = int(k)
    c = min(f + 1, len(sorted_vals) - 1)
    if f == c:
        return sorted_vals[f]
    return sorted_vals[f] + (sorted_vals[c] - sorted_vals[f]) * (k - f)


def worker(worker_id, stop_at, user_token, admin_token):
    conn = http.client.HTTPConnection(HOST, PORT, timeout=10)
    latencies_ms = []
    status_counts = {}
    errors = 0
    step = worker_id

    try:
        while time.perf_counter() < stop_at:
            step += 1
            mode = step % 10
            headers = {}
            method = "GET"
            path = "/api/packages"
            body = None

            if mode in (0, 1, 2):
                path = "/api/packages"
            elif mode in (3, 4):
                path = "/api/packages/paged?page=0&size=9"
            elif mode in (5, 6, 7):
                pkg_id = (step % 10) + 1
                path = f"/api/packages/{pkg_id}"
            elif mode == 8 and user_token:
                path = "/api/bookings/my"
                headers["Authorization"] = f"Bearer {user_token}"
            elif mode == 9 and admin_token:
                path = "/api/admin/dashboard/stats"
                headers["Authorization"] = f"Bearer {admin_token}"

            t0 = time.perf_counter()
            try:
                conn.request(method, path, body=body, headers=headers)
                resp = conn.getresponse()
                resp.read()
                dt_ms = (time.perf_counter() - t0) * 1000.0
                latencies_ms.append(dt_ms)
                status_counts[resp.status] = status_counts.get(resp.status, 0) + 1
                if resp.status >= 400:
                    errors += 1
            except Exception:
                errors += 1
                conn.close()
                conn = http.client.HTTPConnection(HOST, PORT, timeout=10)
    finally:
        conn.close()

    return latencies_ms, status_counts, errors


def main():
    user_token = login_and_get_token(TEST_USER_EMAIL, TEST_USER_PASSWORD)
    admin_token = login_and_get_token(ADMIN_EMAIL, ADMIN_PASSWORD)

    print(f"Starting Load Test: {VIRTUAL_USERS} concurrent virtual users for {DURATION_SECONDS}s against http://{HOST}:{PORT}")
    print(f"Authenticated user session active: {bool(user_token)}, Admin session active: {bool(admin_token)}")

    stop_at = time.perf_counter() + DURATION_SECONDS
    t_start = time.perf_counter()

    all_latencies = []
    merged_statuses = {}
    total_errors = 0

    with concurrent.futures.ThreadPoolExecutor(max_workers=VIRTUAL_USERS) as pool:
        futures = [pool.submit(worker, i, stop_at, user_token, admin_token) for i in range(VIRTUAL_USERS)]
        for fut in concurrent.futures.as_completed(futures):
            lats, counts, errs = fut.result()
            all_latencies.extend(lats)
            total_errors += errs
            for code, cnt in counts.items():
                merged_statuses[code] = merged_statuses.get(code, 0) + cnt

    elapsed = time.perf_counter() - t_start
    total_requests = len(all_latencies) + total_errors
    rps = total_requests / elapsed if elapsed > 0 else 0.0
    all_latencies.sort()

    avg_ms = statistics.mean(all_latencies) if all_latencies else 0.0
    p50_ms = percentile(all_latencies, 50)
    p95_ms = percentile(all_latencies, 95)
    p99_ms = percentile(all_latencies, 99)
    err_rate = (total_errors / total_requests * 100.0) if total_requests > 0 else 0.0

    print("\n=== Load Test Results ===")
    print(f"Virtual Users     : {VIRTUAL_USERS}")
    print(f"Actual Duration   : {elapsed:.2f} s")
    print(f"Total Requests    : {total_requests}")
    print(f"Throughput (RPS)  : {rps:.2f} req/s")
    print(f"Average Latency   : {avg_ms:.2f} ms")
    print(f"Median (P50)      : {p50_ms:.2f} ms")
    print(f"P95 Latency       : {p95_ms:.2f} ms")
    print(f"P99 Latency       : {p99_ms:.2f} ms")
    print(f"Error Count/Rate  : {total_errors} ({err_rate:.2f}%)")
    print(f"HTTP Statuses     : {merged_statuses}")


if __name__ == "__main__":
    main()
