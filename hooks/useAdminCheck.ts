import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { adminService } from "@/services/admin.service";

export function useAdminCheck() {
  const { address } = useAccount();

  return useQuery({
    queryKey: ["admin-check", address],
    queryFn: async () => {
      if (!address) {
        return { is_admin: false };
      }
      const response = await adminService.checkAdmin(address);
      return response.data;
    },
    enabled: !!address,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
