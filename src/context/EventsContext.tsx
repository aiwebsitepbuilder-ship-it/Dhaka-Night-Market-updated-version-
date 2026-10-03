import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
} from 'react';
import { EventDetail } from '../types';
import { INITIAL_EVENTS } from '../data/initialEvents';

const EVENTS_STORAGE_KEY = 'dhaka_events_v2';

interface EventsContextType {
  events: EventDetail[];
  upcomingEvents: EventDetail[];
  previousEvents: EventDetail[];
  currentUpcomingEvent: EventDetail;
  isLoading: boolean;
  lastSaved: Date | null;
  addEvent: (event: Omit<EventDetail, 'id'>) => Promise<EventDetail>;
  updateEvent: (id: string, updates: Partial<EventDetail>) => Promise<void>;
  deleteEvent: (id: string) => Promise<void>;
  duplicateEvent: (id: string) => Promise<EventDetail>;
  resetToDefaults: () => Promise<void>;
  importEvents: (importedList: EventDetail[]) => Promise<void>;
  getEventById: (id: string) => EventDetail | undefined;
}

const EventsContext = createContext<EventsContextType | undefined>(undefined);

function getInitialEventsFromStorage(): EventDetail[] {
  try {
    const stored = localStorage.getItem(EVENTS_STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (err) {
    console.warn('Error reading events from storage:', err);
  }
  return INITIAL_EVENTS;
}

export const EventsProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [events, setEvents] = useState<EventDetail[]>(getInitialEventsFromStorage);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Sync with server API on mount
  useEffect(() => {
    let isMounted = true;

    async function loadFromServer() {
      try {
        const response = await fetch('/api/events');
        if (response.ok) {
          const serverEvents = await response.json();
          if (
            isMounted &&
            Array.isArray(serverEvents) &&
            serverEvents.length > 0
          ) {
            setEvents(serverEvents);
            localStorage.setItem(
              EVENTS_STORAGE_KEY,
              JSON.stringify(serverEvents)
            );
          }
        }
      } catch {
        // Backend API not reachable or static hosting, local storage already loaded
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadFromServer();
    return () => {
      isMounted = false;
    };
  }, []);

  // Helper to persist events to both localStorage and server API
  const persistEvents = async (newEvents: EventDetail[]) => {
    setEvents(newEvents);
    setLastSaved(new Date());

    try {
      localStorage.setItem(EVENTS_STORAGE_KEY, JSON.stringify(newEvents));
    } catch (e) {
      console.warn('Failed saving to localStorage:', e);
    }

    try {
      await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEvents),
      });
    } catch {
      // Backend write optional in purely static environments
    }
  };

  const addEvent = async (
    eventData: Omit<EventDetail, 'id'>
  ): Promise<EventDetail> => {
    const slug = eventData.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
    const newId = `${slug}-${Date.now().toString().slice(-4)}`;

    const newEvent: EventDetail = {
      ...eventData,
      id: newId,
    };

    const updated = [newEvent, ...events];
    await persistEvents(updated);
    return newEvent;
  };

  const updateEvent = async (
    id: string,
    updates: Partial<EventDetail>
  ): Promise<void> => {
    const updated = events.map((event) =>
      event.id === id ? { ...event, ...updates } : event
    );
    await persistEvents(updated);
  };

  const deleteEvent = async (id: string): Promise<void> => {
    const updated = events.filter((event) => event.id !== id);
    await persistEvents(updated);
  };

  const duplicateEvent = async (id: string): Promise<EventDetail> => {
    const source = events.find((e) => e.id === id);
    if (!source) throw new Error('Source event not found');

    const duplicateData: Omit<EventDetail, 'id'> = {
      ...source,
      name: `${source.name} (Copy)`,
      nameBn: `${source.nameBn} (কপি)`,
    };

    return await addEvent(duplicateData);
  };

  const resetToDefaults = async (): Promise<void> => {
    await persistEvents(INITIAL_EVENTS);
  };

  const importEvents = async (importedList: EventDetail[]): Promise<void> => {
    if (Array.isArray(importedList) && importedList.length > 0) {
      await persistEvents(importedList);
    }
  };

  const getEventById = (id: string) => {
    return events.find((e) => e.id === id);
  };

  const upcomingEvents = useMemo(() => {
    return events.filter(
      (e) => e.status === 'upcoming' || e.status === 'ongoing'
    );
  }, [events]);

  const previousEvents = useMemo(() => {
    return events.filter((e) => e.status === 'previous');
  }, [events]);

  const currentUpcomingEvent = useMemo(() => {
    if (upcomingEvents.length > 0) {
      return upcomingEvents[0];
    }
    return events[0] || INITIAL_EVENTS[0];
  }, [upcomingEvents, events]);

  return (
    <EventsContext.Provider
      value={{
        events,
        upcomingEvents,
        previousEvents,
        currentUpcomingEvent,
        isLoading,
        lastSaved,
        addEvent,
        updateEvent,
        deleteEvent,
        duplicateEvent,
        resetToDefaults,
        importEvents,
        getEventById,
      }}
    >
      {children}
    </EventsContext.Provider>
  );
};

export const useEvents = () => {
  const context = useContext(EventsContext);
  if (!context) {
    throw new Error('useEvents must be used within an EventsProvider');
  }
  return context;
};
