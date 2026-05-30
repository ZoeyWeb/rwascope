import { useState, useEffect } from 'react';
import type { Incident } from '../types/incident';
import type { Project } from '../types/projects';

interface UseIncidentsResult {
  incidents: Incident[];
  loading: boolean;
}

export function useIncidents(): UseIncidentsResult {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/data/projects/projects.json')
      .then(r => r.json())
      .then((projects: Project[]) => {
        const registry: Incident[] = projects
          .filter((p): p is Project & Required<Pick<Project, 'incident_id' | 'incident_date' | 'severity' | 'primary_asset_class' | 'affected_rarm_layers' | 'permalink' | 'citation_meta' | 'postmortem'>> =>
            Boolean(p.incident_id && p.postmortem)
          )
          .map(p => ({
            incident_id: p.incident_id,
            incident_date: p.incident_date,
            severity: p.severity as Incident['severity'],
            primary_asset_class: p.primary_asset_class as Incident['primary_asset_class'],
            affected_rarm_layers: p.affected_rarm_layers as Incident['affected_rarm_layers'],
            permalink: p.permalink,
            citation_meta: p.citation_meta,
            slug: p.slug,
            name: p.name,
            postmortem: p.postmortem,
            status: p.status,
            asset_class: p.asset_class,
          }))
          .sort((a, b) => b.incident_date.localeCompare(a.incident_date));

        setIncidents(registry);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return { incidents, loading };
}
