// Workshop compatibility helpers, not authentication.
export const ACCESS_COOKIE = 'workshop_demo';
export function verifyPassword(_input: string) { return false; }
export async function accessToken(): Promise<string> { return ''; }
