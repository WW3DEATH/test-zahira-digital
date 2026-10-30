import { collection, doc, setDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { SchoolEvent, SchoolEventType } from '../types';

interface GoogleEventItem {
  id: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: {
    date?: string;
    dateTime?: string;
  };
  end?: {
    date?: string;
    dateTime?: string;
  };
}

/**
 * Fetch events directly from user's primary Google Calendar using the client-side OAuth access token
 */
export async function fetchGoogleCalendarEvents(accessToken: string): Promise<GoogleEventItem[]> {
  const timeMin = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // From 30 days ago forward
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events?timeMin=${encodeURIComponent(
    timeMin
  )}&singleEvents=true&orderBy=startTime&maxResults=50`;

  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Google Calendar API error:', errorBody);
    throw new Error(`Google Calendar request failed (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  return data.items || [];
}

/**
 * Helper to classify event type based on title and description
 */
function inferEventType(title: string = '', description: string = ''): SchoolEventType {
  const lower = `${title} ${description}`.toLowerCase();
  if (lower.includes('exam') || lower.includes('test') || lower.includes('assessment') || lower.includes('paper') || lower.includes('quiz')) {
    return 'exam';
  }
  if (lower.includes('holiday') || lower.includes('break') || lower.includes('vacation') || lower.includes('closure') || lower.includes('poya')) {
    return 'holiday';
  }
  if (lower.includes('lab') || lower.includes('practic') || lower.includes('lecture') || lower.includes('class') || lower.includes('term')) {
    return 'academic';
  }
  if (lower.includes('sport') || lower.includes('cricket') || lower.includes('match') || lower.includes('athletic')) {
    return 'sports';
  }
  if (lower.includes('meeting') || lower.includes('conference') || lower.includes('assembly') || lower.includes('pta')) {
    return 'meeting';
  }
  return 'general';
}

/**
 * Sync Google Calendar events into Firestore 'schoolEvents' collection
 */
export async function syncGoogleCalendarToFirestore(
  accessToken: string,
  userId: string,
  userName: string = 'Zahira Faculty'
): Promise<{ syncedCount: number; message: string }> {
  const items = await fetchGoogleCalendarEvents(accessToken);
  let count = 0;

  for (const item of items) {
    if (!item.summary) continue;

    const startDateStr = item.start?.dateTime
      ? item.start.dateTime.split('T')[0]
      : item.start?.date || new Date().toISOString().split('T')[0];

    const endDateStr = item.end?.dateTime
      ? item.end.dateTime.split('T')[0]
      : item.end?.date;

    const timeStr = item.start?.dateTime
      ? item.start.dateTime.split('T')[1]?.substring(0, 5)
      : undefined;

    const eventId = `gcal-${item.id}`;
    const schoolEvent: SchoolEvent = {
      id: eventId,
      title: item.summary,
      description: item.description || 'Synchronized from Google Calendar',
      startDate: startDateStr,
      endDate: endDateStr,
      time: timeStr,
      type: inferEventType(item.summary, item.description),
      classId: 'class-2k28-science-em',
      location: item.location || 'Zahira College',
      createdBy: userId,
      createdByName: userName,
      googleEventId: item.id,
      isSyncedWithGoogle: true,
      createdAt: new Date().toISOString(),
    };

    await setDoc(doc(db, 'schoolEvents', eventId), schoolEvent, { merge: true });
    count++;
  }

  return {
    syncedCount: count,
    message: `Successfully synchronized ${count} events from Google Calendar to Zahira College 2k28 Science EM schedule.`,
  };
}

/**
 * Push an event created in the app to Google Calendar
 */
export async function createGoogleCalendarEvent(
  accessToken: string,
  event: Partial<SchoolEvent>
): Promise<{ googleEventId: string }> {
  const isAllDay = !event.time;
  const startObj = isAllDay
    ? { date: event.startDate }
    : { dateTime: `${event.startDate}T${event.time}:00Z` };

  const endObj = isAllDay
    ? { date: event.endDate || event.startDate }
    : { dateTime: `${event.endDate || event.startDate}T${event.time || '10:00'}:00Z` };

  const body = {
    summary: event.title,
    description: `${event.description || ''}\n\n[Zahira College 2k28 Science EM - Type: ${event.type?.toUpperCase()}]`,
    location: event.location || 'Zahira College Mawanella',
    start: startObj,
    end: endObj,
  };

  const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error('Failed to create Google Calendar event:', errorBody);
    throw new Error(`Failed to create event in Google Calendar: ${errorBody}`);
  }

  const created = await response.json();
  return { googleEventId: created.id };
}

/**
 * Remove an event from Google Calendar (MUST be preceded by user confirmation dialog per Workspace guidelines)
 */
export async function deleteGoogleCalendarEvent(
  accessToken: string,
  googleEventId: string
): Promise<boolean> {
  const url = `https://www.googleapis.com/calendar/v3/calendars/primary/events/${encodeURIComponent(googleEventId)}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok && response.status !== 404) {
    console.error('Failed to delete Google Calendar event:', await response.text());
    return false;
  }

  return true;
}
