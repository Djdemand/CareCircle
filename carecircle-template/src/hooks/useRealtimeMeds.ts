import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL || '',
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const useRealtimeMeds = () => {
  const [logs, setLogs] = useState<any[]>([]);

  useEffect(() => {
    // 1. Initial fetch
    const fetchLogs = async () => {
      const { data } = await supabase
        .from('med_logs')
        .select('*')
        .order('administered_at', { ascending: false });
      if (data) setLogs(data);
    };

    fetchLogs();

    // 2. Real-time subscription for the 5-user team
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'med_logs' },
        (payload) => {
          console.log('New dose logged by team member!', payload);
          setLogs((prev) => [payload.new, ...prev]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return { logs };
};
