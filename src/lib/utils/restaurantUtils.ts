import { type OpeningHours, type DayKey } from "@/types/api.types";

/**
 * Checks if a restaurant is currently open based on its opening hours.
 * Assumes UK time (Europe/London) as the base for all restaurants.
 */
export function isRestaurantOpen(openingHours: OpeningHours | null | undefined): boolean {
  if (!openingHours || Object.keys(openingHours).length === 0) {
    // If no hours are set, we assume it's open (or you could change this to false)
    return true; 
  }

  try {
    const now = new Date();
    
    // Get current day in UK time (mon, tue, wed...)
    const ukDayStr = now.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      timeZone: 'Europe/London' 
    }).toLowerCase();
    
    // DayKey mapping if necessary (mon, tue, wed, thu, fri, sat, sun)
    // toLocaleDateString returns "mon", "tue", "wed", "thu", "fri", "sat", "sun"
    const ukDay = ukDayStr as DayKey;
    
    const dayHours = openingHours[ukDay];
    if (!dayHours) return false; // Closed today

    const { open, close } = dayHours;
    if (!open || !close) return false;

    // Current time in UK (HH:mm)
    const ukTime = now.toLocaleTimeString('en-GB', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit',
      timeZone: 'Europe/London' 
    });
    
    const [nowH, nowM] = ukTime.split(':').map(Number);
    const [openH, openM] = open.split(':').map(Number);
    const [closeH, closeM] = close.split(':').map(Number);

    const nowTotal = nowH * 60 + nowM;
    const openTotal = openH * 60 + openM;
    let closeTotal = closeH * 60 + closeM;

    // Handle overnight hours (e.g., 18:00 to 02:00)
    if (closeTotal <= openTotal) {
      // If current time is after open time OR before close time, it's open
      return nowTotal >= openTotal || nowTotal < closeTotal;
    }

    return nowTotal >= openTotal && nowTotal < closeTotal;
  } catch (err) {
    console.error("Error checking restaurant status:", err);
    return true; // Fallback to open on error to avoid blocking orders
  }
}
