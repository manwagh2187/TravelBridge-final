'use strict';

function toSafeDetails(raw) {
  if (!Array.isArray(raw)) return [];
  return raw.map((item) => ({
    code: item?.code || 'UNKNOWN',
    title: item?.title || 'Error',
    detail: item?.detail || 'Request failed',
    source: item?.source || undefined
  }));
}

function mapAmadeusError(error, fallbackMessage = 'Upstream request failed') {
  const status = error?.response?.status || 502;
  const data = error?.response?.data;

  const safe = {
    error: fallbackMessage,
    status,
    details: []
  };

  if (data?.errors) {
    safe.details = toSafeDetails(data.errors);
  } else if (data?.error_description) {
    safe.details = [{ code: 'AUTH_ERROR', title: 'Authorization failed', detail: data.error_description }];
  } else if (data?.message) {
    safe.details = [{ code: 'UPSTREAM_ERROR', title: 'Amadeus error', detail: data.message }];
  }

  // Never leak tokens, headers, full upstream payload, stack traces
  return safe;
}

module.exports = {
  mapAmadeusError
};