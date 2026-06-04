import { useQuery } from '@tanstack/react-query';
import { intelligenceApi, intelligenceQueryKeys } from '../api/intelligenceApi';
import { intelligenceConfig } from '../config';

export function useIntelligenceById(id: string | undefined) {
  return useQuery({
    queryKey: id ? intelligenceQueryKeys.byId(id) : ['intelligence', 'byId', '__noop__'],
    queryFn: () => intelligenceApi.getById(id!),
    enabled: !!id,
    staleTime: intelligenceConfig.cache.staleTimeMs,
    gcTime: intelligenceConfig.cache.gcTimeMs,
  });
}
