import { useState, useEffect } from 'react';
import type { Incident } from '../types/incidents';

interface UseIncidentsDatabaseResult {
  incidents: Incident[];
  loading: boolean;
}

export function useIncidentsDatabase(): UseIncidentsDatabaseResult {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/incidents/incidents.json')
      .then(r => r.json())
      .then((data: Incident[]) => {
        const sorted = [...data].sort((a, b) => b.date.localeCompare(a.date));
        setIncidents(sorted);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { incidents, loading };
}
