// =============================================================================
// PawLand - Dog Selection Service
// Manages last selected dog in localStorage
// =============================================================================

const STORAGE_KEY = "pawland_last_selected_dog";

/**
 * Save the last selected dog ID to localStorage
 */
export function saveLastSelectedDog(dogId: number): void {
  localStorage.setItem(STORAGE_KEY, dogId.toString());
}

/**
 * Get the last selected dog ID from localStorage
 */
export function getLastSelectedDog(): number | null {
  const saved = localStorage.getItem(STORAGE_KEY);
  return saved ? parseInt(saved, 10) : null;
}

/**
 * Clear the last selected dog from localStorage
 */
export function clearLastSelectedDog(): void {
  localStorage.removeItem(STORAGE_KEY);
}
