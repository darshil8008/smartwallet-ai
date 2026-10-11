const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL;

export async function getCards() {
  const response = await fetch(`${API_BASE_URL}/api/cards`);

  if (!response.ok) {
    throw new Error(`Failed to load cards: ${response.status}`);
  }

  return response.json();
}