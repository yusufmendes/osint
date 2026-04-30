import { useMutation, useQueryClient } from '@tanstack/react-query';
import { deleteById, intelligenceQueryKeys } from '../api/intelligenceApi';

export function useDeleteIntelligence() {
  const qc = useQueryClient();
  return useMutation<void, Error, string>({
    mutationFn: (id: string) => deleteById(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: intelligenceQueryKeys.byId(id) });
      qc.invalidateQueries({ queryKey: intelligenceQueryKeys.all });
    },
  });
}
