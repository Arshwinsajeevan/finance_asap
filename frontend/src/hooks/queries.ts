import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

// --- Dashboard Queries ---

export const useOverviewData = (startDate: Date | null, endDate: Date | null) => {
  return useQuery({
    queryKey: ['overview', startDate?.toISOString(), endDate?.toISOString()],
    queryFn: async () => {
      const params: any = {};
      if (startDate && endDate) {
        params.startDate = startDate.toISOString();
        params.endDate = endDate.toISOString();
      }
      const { data } = await api.get('/finance/reports/overview', { params });
      return data.data; // Assumes backend returns { success: true, data: { ... } }
    },
    // Cache the overview for 5 minutes
    staleTime: 5 * 60 * 1000, 
  });
};
