import { useQuery } from '@tanstack/react-query';
import { getById, intelligenceQueryKeys } from '../api/intelligenceApi';
import { intelligenceConfig } from '../config';
import type { Intelligence } from '../domain/intelligence';

export function useIntelligenceById(id: string | undefined) {
  return useQuery<Intelligence>({
    queryKey: id ? intelligenceQueryKeys.byId(id) : ['intelligence', 'byId', '__noop__'],
    queryFn: () => getById(id as string),
    enabled: !!id,
    staleTime: intelligenceConfig.query.staleTime,
    gcTime: intelligenceConfig.query.gcTime,
  });
}
