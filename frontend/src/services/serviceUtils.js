export function normalizeCollectionResponse(response, collectionKeys = []) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return {
      data: payload,
      items: payload,
      meta: null,
      raw: response,
    };
  }

  const nestedData = Array.isArray(payload?.data) ? payload.data : null;
  const matchedKey = collectionKeys.find((key) => Array.isArray(payload?.[key]));
  const items = nestedData || (matchedKey ? payload[matchedKey] : []);

  return {
    data: items,
    items,
    meta: payload?.meta || payload?.links || null,
    raw: response,
  };
}

export function normalizePaginatedCollectionResponse(response, collectionKeys = []) {
  const payload = response?.data ?? response;

  if (Array.isArray(payload)) {
    return {
      data: payload,
      items: payload,
      pagination: {
        current_page: 1,
        last_page: 1,
        total: payload.length,
      },
      raw: response,
    };
  }

  const nestedData = Array.isArray(payload?.data)
    ? payload.data
    : collectionKeys.map((key) => payload?.[key]).find((value) => Array.isArray(value)) || [];

  return {
    data: nestedData,
    items: nestedData,
    pagination: {
      current_page: Number(payload?.current_page || 1),
      last_page: Number(payload?.last_page || 1),
      total: Number(payload?.total || nestedData.length || 0),
    },
    raw: response,
  };
}

export function normalizeEntityResponse(response, entityKeys = []) {
  const payload = response?.data ?? response;

  if (!payload || Array.isArray(payload)) {
    return {
      data: payload || null,
      item: payload || null,
      raw: response,
    };
  }

  const matchedKey = entityKeys.find((key) => payload?.[key] && !Array.isArray(payload[key]));
  const item = matchedKey ? payload[matchedKey] : payload;

  return {
    data: item,
    item,
    raw: response,
  };
}

export function getErrorMessage(error, fallback = 'Terjadi kesalahan.') {
  return (
    error?.response?.data?.message ||
    error?.message ||
    fallback
  );
}
