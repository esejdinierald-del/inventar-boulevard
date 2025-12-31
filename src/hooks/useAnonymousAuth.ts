import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Session } from '@supabase/supabase-js';

export const useAnonymousAuth = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const signIn = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      setSession(null);
      setError(error.message);
      setIsLoading(false);
      return;
    }

    setSession(data.session);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    // Listener first
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setIsLoading(false);
    });

    // Then initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session);
        setIsLoading(false);
      } else {
        void signIn();
      }
    });

    return () => subscription.unsubscribe();
  }, [signIn]);

  return {
    session,
    isLoading,
    isAuthenticated: !!session,
    error,
    retry: signIn,
  };
};

