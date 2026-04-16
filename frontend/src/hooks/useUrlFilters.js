import { useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

/**
 * Syncs a flat filter object to URL search params using React Router's
 * useSearchParams. Keys absent from the URL fall back to `defaults`.
 *
 * @param {object} defaults  Default value for every filter key.
 * @returns {[object, function]} [params, setParams]
 *
 * setParams(changes, opts?)
 *   changes  – partial object to shallow-merge into current params
 *   opts.resetPage  – when true (default) and 'page' is NOT in changes,
 *                     page is removed from URL (defaults to '1').
 *   opts.replace    – when true (default) replaces the history entry instead
 *                     of pushing a new one.  Set to false for major navigation
 *                     (e.g. tab switches) so the browser Back button works.
 */
export function useUrlFilters(defaults) {
  const [searchParams, setSearchParams] = useSearchParams();

  // Read current values; fall back to defaults for missing keys
  const params = useMemo(() => {
    const out = { ...defaults };
    for (const key of Object.keys(defaults)) {
      const v = searchParams.get(key);
      if (v !== null) out[key] = v;
    }
    return out;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const setParams = useCallback(
    (changes, { resetPage = true, replace = true } = {}) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          for (const [k, v] of Object.entries(changes)) {
            // Remove from URL when value matches default → keeps URLs clean
            if (v === defaults[k] || v === '' || v == null) {
              next.delete(k);
            } else {
              next.set(k, String(v));
            }
          }
          // Reset pagination when any non-page filter changes
          if (resetPage && !('page' in changes)) {
            next.delete('page'); // absence = page 1 (the default)
          }
          return next;
        },
        { replace }
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [setSearchParams]
  );

  return [params, setParams];
}
