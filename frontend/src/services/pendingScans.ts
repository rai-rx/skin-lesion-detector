import { getApiUrl } from './apiUrl';

const PENDING_SCANS_KEY = 'pending_scans';

export interface PendingScan {
  image: string;
  result: Record<string, unknown>;
}

export function queuePendingScan(scan: PendingScan) {
  try {
    const stored = sessionStorage.getItem(PENDING_SCANS_KEY);
    const scans = stored ? JSON.parse(stored) : [];
    const nextScans = Array.isArray(scans) ? scans : [];
    const scanKey = JSON.stringify({ image: scan.image, result: scan.result });

    if (!nextScans.some((item) => JSON.stringify(item) === scanKey)) {
      nextScans.push(scan);
      sessionStorage.setItem(PENDING_SCANS_KEY, JSON.stringify(nextScans));
    }
  } catch (error) {
    console.error('Unable to temporarily save scan:', error);
  }
}

export async function importPendingScans(accessToken: string): Promise<boolean> {
  let scans: PendingScan[];

  try {
    const stored = sessionStorage.getItem(PENDING_SCANS_KEY);
    scans = stored ? JSON.parse(stored) : [];
    if (!Array.isArray(scans) || scans.length === 0) return true;
  } catch (error) {
    console.error('Unable to read temporarily saved scans:', error);
    return false;
  }

  const imported: PendingScan[] = [];
  for (const scan of scans) {
    try {
      const response = await apiFetch('/me/import-scan', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(scan),
      });

      if (response.ok) imported.push(scan);
    } catch (error) {
      console.error('Unable to import temporarily saved scan:', error);
    }
  }

  const remaining = scans.filter((scan) => !imported.includes(scan));
  if (remaining.length > 0) {
    sessionStorage.setItem(PENDING_SCANS_KEY, JSON.stringify(remaining));
    return false;
  }

  sessionStorage.removeItem(PENDING_SCANS_KEY);
  return true;
}
