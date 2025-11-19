const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api';

async function apiClient<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    credentials: 'include',
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
  });

  if (!response.ok) {
    let errorMessage = 'Falha na requisição à API.';
    try {
      const errorData = await response.json();
      if (errorData?.message) errorMessage = errorData.message;
    } catch {
      // corpo vazio
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export default apiClient;
