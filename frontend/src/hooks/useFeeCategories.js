import { useState, useEffect } from 'react';
import { getFeeCategories } from '../services/feeApi';

/**
 * Fetches active fee categories for a given module from the fee configuration.
 * Falls back to the provided defaultCategories if none are configured.
 *
 * @param {string} moduleName - 'Library' | 'Hostel' | 'Billing' | 'FEE' | 'Exam' | 'Alumni'
 * @param {string[]} defaultCategories - fallback list if no categories are configured
 * @returns {{ categories: string[], loading: boolean, raw: object[] }}
 */
export function useFeeCategories(moduleName, defaultCategories = []) {
  const [categories, setCategories] = useState([]);
  const [raw, setRaw] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!moduleName) { setLoading(false); return; }
    setLoading(true);
    getFeeCategories({ module_name: moduleName, status: 'active' })
      .then(res => {
        const data = res.data.data || [];
        setRaw(data);
        const names = data.map(c => c.fee_category).filter(Boolean);
        setCategories(names.length ? names : defaultCategories);
      })
      .catch(() => setCategories(defaultCategories))
      .finally(() => setLoading(false));
  }, [moduleName]); // eslint-disable-line react-hooks/exhaustive-deps

  return { categories, loading, raw };
}
