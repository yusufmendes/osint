import { useQuery } from '@tanstack/react-query';
import { executeQuery, intelligenceQueryKeys } from '../api/intelligenceApi';
import { intelligenceConfig } from '../config';
import type { IntelligenceQuery, IntelligenceQueryResult } from '../domain/intelligence';

function hashQuery(q: IntelligenceQuery): string {
  return JSON.stringify(q);
}

export function useIntelligenceQuery(q: IntelligenceQuery) {
  const hash = hashQuery(q);
  return useQuery<IntelligenceQueryResult>({
    queryKey: intelligenceQueryKeys.query(hash),
    queryFn: () => executeQuery(q),
    staleTime: intelligenceConfig.query.staleTime,
    gcTime: intelligenceConfig.query.gcTime,
  });
}
