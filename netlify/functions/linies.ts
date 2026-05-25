import { errorResponse, fetchAllLinies, jsonResponse } from './_tmb';

export default async (): Promise<Response> => {
  try {
    const linies = await fetchAllLinies();
    return jsonResponse(200, linies);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return errorResponse(502, message);
  }
};

export const config = { path: '/api/linies' };
