/** Product deep links return to merch; other pages return to the main menu. */
export function getControllerBackPath(pathname: string): string | null {
  if (pathname === '/') return null;
  return /^\/merch\/[^/]+\/?$/.test(pathname) ? '/merch' : '/';
}
