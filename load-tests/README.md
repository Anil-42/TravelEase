# TravelEase Load Testing

This directory contains repeatable load-testing scripts for validating TravelEase API throughput, caching efficiency, HikariCP connection pooling, and latency percentiles.

## 1. Using k6 (Recommended for Distributed / High-VU Staging)

```bash
k6 run -e BASE_URL=http://localhost:8080/api \
       -e TEST_USER_EMAIL=customer@example.com \
       -e TEST_USER_PASSWORD="YourStrongPassword123!" \
       load-tests/k6-load-test.js
```

## 2. Using the Included Python Concurrency Harness

Works out of the box with standard Python 3 (no extra packages needed):

```powershell
$env:LOAD_VUS = "200"
$env:LOAD_DURATION = "20"
python load-tests/run_load_test.py
```
