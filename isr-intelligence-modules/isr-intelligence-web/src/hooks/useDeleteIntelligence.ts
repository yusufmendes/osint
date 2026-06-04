import { useMutation, useQueryClient } from '@tanstack/react-query';
import { intelligenceApi, intelligenceQueryKeys } from '../api/intelligenceApi';

export function useDeleteIntelligence() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => intelligenceApi.deleteById(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: intelligenceQueryKeys.all }),
  });
}
