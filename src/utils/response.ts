export function successResponse(body: any, statusCode = 200) {
  return {
    statusCode,
    body: JSON.stringify(body),
  };
}

export function errorResponse(message: string, statusCode = 400) {
  return {
    statusCode,
    body: JSON.stringify({ error: message }),
  };
}
