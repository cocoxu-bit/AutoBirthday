export interface RawCalendarBirthday {
  id: string;
  name: string;
  birthDay: number;
  birthMonth: number;
  birthYear: number | null;
  rawSummary: string;
  source: 'google' | 'apple';
}

function cleanBirthdayName(summary: string): string {
  let name = summary.trim();

  // Remove common prefixes
  name = name.replace(/^(cumpleaños\s+de\s+|cumple\s+de\s+|cumple\s+|birthday\s+of\s+|aniversario\s+de\s+)/i, '');
  
  // Remove common suffixes (e.g. " - Cumpleaños", "'s Birthday", " (Cumple)")
  name = name.replace(/(\s*-\s*cumpleaños|\s*-\s*cumple|'s\s*birthday|\s*\(\s*cumpleaños\s*\)|\s*\(\s*cumple\s*\))$/i, '');

  // Remove trailing emojis or special symbols
  name = name.replace(/[\u{1F300}-\u{1F9FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();

  return name || summary;
}

export async function fetchGoogleCalendarBirthdays(accessToken: string): Promise<RawCalendarBirthday[]> {
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/json',
  };

  const results: RawCalendarBirthday[] = [];
  const seenKeys = new Set<string>();

  try {
    // 1. Fetch user's calendars list
    const calListRes = await fetch('https://www.googleapis.com/calendar/v3/users/me/calendarList', {
      headers,
    });

    if (!calListRes.ok) {
      const err = await calListRes.json().catch(() => ({}));
      throw new Error(err.error?.message || 'Error al conectar con Google Calendar');
    }

    const calListData = await calListRes.json();
    const calendars: Array<{ id: string; summary?: string }> = calListData.items || [];

    // Target the primary calendar and any birthday-specific calendars
    const targetCalendarIds: string[] = ['primary'];

    for (const cal of calendars) {
      const summaryLower = (cal.summary || '').toLowerCase();
      const id = cal.id;
      if (
        id === '#contacts@group.v.calendar.google.com' ||
        summaryLower.includes('cumpleaños') ||
        summaryLower.includes('birthday') ||
        summaryLower.includes('contacts')
      ) {
        if (!targetCalendarIds.includes(id)) {
          targetCalendarIds.push(id);
        }
      }
    }

    // 2. Query events from target calendars
    for (const calId of targetCalendarIds) {
      try {
        const eventsRes = await fetch(
          `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calId)}/events?maxResults=2500&singleEvents=false`,
          { headers }
        );

        if (!eventsRes.ok) continue;

        const eventsData = await eventsRes.json();
        const items = eventsData.items || [];

        for (const item of items) {
          const summary = item.summary || '';
          const isBirthdayCal = calId.includes('contacts') || calId.includes('birthday');

          // Check if this event looks like a birthday or is in a birthday calendar
          const summaryLower = summary.toLowerCase();
          const isBirthdayEvent = 
            isBirthdayCal ||
            summaryLower.includes('cumple') ||
            summaryLower.includes('birthday') ||
            summaryLower.includes('aniversario') ||
            (item.recurrence && item.recurrence.some((r: string) => r.includes('FREQ=YEARLY')));

          if (!isBirthdayEvent || !summary) continue;

          // Parse start date
          const dateStr = item.start?.date || item.start?.dateTime;
          if (!dateStr) continue;

          const dateObj = new Date(dateStr);
          if (isNaN(dateObj.getTime())) continue;

          // In YYYY-MM-DD or ISO strings
          const parts = dateStr.split('T')[0].split('-');
          let birthDay: number;
          let birthMonth: number;
          let birthYear: number | null = null;

          if (parts.length >= 3) {
            birthMonth = parseInt(parts[1], 10);
            birthDay = parseInt(parts[2], 10);
          } else {
            birthDay = dateObj.getUTCDate();
            birthMonth = dateObj.getUTCMonth() + 1;
          }
          birthYear = null; // Explicitly null to prevent wrong birth years

          if (!birthDay || !birthMonth || birthMonth < 1 || birthMonth > 12) continue;

          const cleanName = cleanBirthdayName(summary);
          const key = `${cleanName.toLowerCase()}_${birthDay}_${birthMonth}`;

          if (seenKeys.has(key)) continue;
          seenKeys.add(key);

          results.push({
            id: item.id || `gcal_${Date.now()}_${Math.random()}`,
            name: cleanName,
            birthDay,
            birthMonth,
            birthYear,
            rawSummary: summary,
            source: 'google',
          });
        }
      } catch (calErr) {
        console.warn(`Error fetching events for calendar ${calId}:`, calErr);
      }
    }

    return results;
  } catch (error: any) {
    console.error('fetchGoogleCalendarBirthdays error:', error);
    throw new Error(error.message || 'Error al obtener eventos de Google Calendar');
  }
}
