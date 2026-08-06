import { format, utcToZonedTime, zonedTimeToUtc} from 'date-fns-tz'

// By default we assume the offset is 0 until we fetch from Satellite (WorldTimeAPI)
let satelliteOffsetMs = 0;
let isSatelliteSynced = false;
let currentNativeTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

/**
 * Initializes the Satellite Time Sync by fetching the true UTC time.
 */
export async function syncSatelliteTime(timezone: string) {
 currentNativeTimezone = timezone;
 try {
 const startFetch = Date.now();
 // Use WorldTimeAPI to get absolute time for the timezone
 const response = await fetch(`http://worldtimeapi.org/api/timezone/${timezone}`);
 if (!response.ok) throw new Error('Network response was not ok');
 
 const data = await response.json();
 const endFetch = Date.now();
 
 // Estimate network latency
 const latency = (endFetch - startFetch) / 2;
 
 // Unix timestamp from satellite in seconds -> ms
 const satelliteMs = data.unixtime * 1000 + latency;
 const deviceMs = Date.now();
 
 satelliteOffsetMs = satelliteMs - deviceMs;
 isSatelliteSynced = true;
 
 console.log(`📡 Satellite Time Synced! Offset: ${satelliteOffsetMs}ms (Timezone: ${timezone})`);
} catch (err) {
 console.warn('⚠️ Satellite Time Sync Failed. Falling back to device clock.', err);
 satelliteOffsetMs = 0;
 isSatelliteSynced = false;
}
}

export function isTimeSynced() {
 return isSatelliteSynced;
}

export function getSatelliteOffset() {
 return satelliteOffsetMs;
}

/**
 * Returns a Javascript Date object adjusted to the Satellite Time.
 * If the device clock is 5 minutes behind, this will return a Date that is +5 minutes.
 */
export function getTrueDate(): Date {
 return new Date(Date.now() + satelliteOffsetMs);
}

/**
 * Formats a Date object specifically for the user's Native Timezone.
 * Always use this instead of .toISOString().split('T')[0]
 */
export function formatInNativeTimezone(date: Date, formatStr: string = 'yyyy-MM-dd'): string {
 const zonedDate = utcToZonedTime(date, currentNativeTimezone);
 return format(zonedDate, formatStr, { timeZone: currentNativeTimezone});
}

/**
 * Gets today's date string (yyyy-MM-dd) based on Satellite Time and Native Timezone
 */
export function getTrueTodayString(): string {
 return formatInNativeTimezone(getTrueDate(), 'yyyy-MM-dd');
}
