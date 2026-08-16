/**
 * The shell's sidebar open state, persisted via cookie so the preference survives a reload.
 * Note that every call returns its own ref — the cookie is the shared thing, not the ref —
 * so two live callers do not stay in step until the next read.
 */
export function useSidebarOpen() {
  return useCookie<boolean>('sidebar-open', {
    default: () => true,
    maxAge: 60 * 60 * 24 * 365, // Persist for 1 year (adjust as needed)
  })
}
