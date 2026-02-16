import { useEffect, useState } from 'react';
import { Sails } from 'sails-js';
import { SailsIdlParser } from 'sails-js-parser';

export function useSails(idl: string) {
  const [sails, setSails] = useState<Sails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function init() {
      try {
        const parser = await SailsIdlParser.new();
        const sailsInstance = new Sails(parser);
        await sailsInstance.parseIdl(idl);
        
        if (mounted) {
          setSails(sailsInstance);
          setLoading(false);
        }
      } catch (err: any) {
        if (mounted) {
          setError(err.message || 'Failed to load IDL');
          setLoading(false);
        }
      }
    }

    init();

    return () => {
      mounted = false;
    };
  }, []);

  return { sails, loading, error };
}

