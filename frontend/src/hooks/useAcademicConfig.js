import { useState, useEffect } from 'react';
import { getAllConfig } from '../services/configApi';

/**
 * Fetches all academic configuration from the backend.
 * Returns string arrays for dropdowns AND full item objects for management UIs.
 * All data is sourced from the Academic Settings admin page → MasterData collection.
 */
export function useAcademicConfig() {
  const [programs, setPrograms]           = useState([]);
  const [batches, setBatches]             = useState([]);
  const [streams, setStreams]             = useState([]);
  const [academicYears, setAcademicYears] = useState([]);
  const [statuses, setStatuses]           = useState([]);
  const [quotas, setQuotas]               = useState([]);
  const [loading, setLoading]             = useState(true);

  useEffect(() => {
    getAllConfig()
      .then(res => {
        const cfg = res.data?.data || {};
        setPrograms(Array.isArray(cfg.programs)      ? cfg.programs      : []);
        setBatches(Array.isArray(cfg.batches)        ? cfg.batches       : []);
        setStreams(Array.isArray(cfg.streams)        ? cfg.streams       : []);
        setAcademicYears(Array.isArray(cfg.academicYears) ? cfg.academicYears : []);
        setStatuses(Array.isArray(cfg.statuses)      ? cfg.statuses      : []);
        setQuotas(Array.isArray(cfg.quotas)          ? cfg.quotas        : []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return { programs, batches, streams, academicYears, statuses, quotas, loading };
}
