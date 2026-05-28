import { useCallback, useState } from 'react';
import { getRoutePlan, type RoutePlanRequest } from '../services/planner';
import type { RoutePlan } from '../types/planner';

interface State {
  data: RoutePlan | null;
  loading: boolean;
  error: string | null;
}

export function useRoutePlan() {
  const [state, setState] = useState<State>({
    data: null,
    loading: false,
    error: null,
  });

  const trigger = useCallback(async (req: RoutePlanRequest) => {
    setState({ data: null, loading: true, error: null });
    try {
      const data = await getRoutePlan(req);
      setState({ data, loading: false, error: null });
    } catch (err) {
      setState({
        data: null,
        loading: false,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }, []);

  const reset = useCallback(() => {
    setState({ data: null, loading: false, error: null });
  }, []);

  return { ...state, trigger, reset };
}
