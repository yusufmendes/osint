import { useQuery } from '@tanstack/react-query';
import { intelligenceApi, intelligenceQueryKeys } from '../api/intelligenceApi';
import { intelligenceConfig } from '../config';
import type { IntelligenceQuery } from '../domain/intelligence';

export function useIntelligenceQuery(q: IntelligenceQuery) {
  return useQuery({
    queryKey: intelligenceQueryKeys.query(q),
    queryFn: () => intelligenceApi.executeQuery(q),
    staleTime: intelligenceConfig.cache.staleTimeMs,
    gcTime: intelligenceConfig.cache.gcTimeMs,
  });
}
