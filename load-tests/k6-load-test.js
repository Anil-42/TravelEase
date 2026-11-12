import http from 'k6/http';
import { check, sleep } from 'k6';
import { Trend, Rate } from 'k6/metrics';

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080/api';
const USER_EMAIL = __ENV.TEST_USER_EMAIL || '';
const USER_PASSWORD = __ENV.TEST_USER_PASSWORD || '';

const errorRate = new Rate('errors');
const pkgTrend = new Trend('package_list_duration');
const detailTrend = new Trend('package_detail_duration');
const bookingTrend = new Trend('booking_read_duration');

export const options = {
  stages: [
    { duration: '15s', target: 100 },
    { duration: '30s', target: 500 },
    { duration: '30s', target: 1000 },
    { duration: '15s', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1200'],
    errors: ['rate<0.02'],
  },
};

export function setup() {
  if (!USER_EMAIL || !USER_PASSWORD) {
    return { token: null };
  }
  const res = http.post(
    `${BASE_URL}/auth/login`,
    JSON.stringify({ email: USER_EMAIL, password: USER_PASSWORD }),
    { headers: { 'Content-Type': 'application/json' } }
  );
  if (res.status === 200) {
    return { token: res.json('token') };
  }
  return { token: null };
}

export default function (data) {
  // 1. Browse cached package catalog
  const listRes = http.get(`${BASE_URL}/packages`);
  pkgTrend.add(listRes.timings.duration);
  const listOk = check(listRes, {
    'packages list 200': (r) => r.status === 200,
  });
  errorRate.add(!listOk);

  // 2. View random destination detail (IDs 1-10)
  const pkgId = Math.floor(Math.random() * 10) + 1;
  const detailRes = http.get(`${BASE_URL}/packages/${pkgId}`);
  detailTrend.add(detailRes.timings.duration);
  const detailOk = check(detailRes, {
    'package detail 200': (r) => r.status === 200,
  });
  errorRate.add(!detailOk);

  // 3. Authenticated user bookings view (when test credentials supplied)
  if (data.token && Math.random() < 0.3) {
    const authHeaders = { headers: { Authorization: `Bearer ${data.token}` } };
    const bookingsRes = http.get(`${BASE_URL}/bookings/my`, authHeaders);
    bookingTrend.add(bookingsRes.timings.duration);
    check(bookingsRes, { 'my bookings 200': (r) => r.status === 200 });
  }

  sleep(0.2);
}
