import { useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import { adminService } from "@/services/admin.service";
import { useAuthStore } from "@/store/auth.store";

export function useAdminCheck() {
  const { address } = useAccount();
  const { isAuthenticated } = useAuthStore();

  return useQuery({
    queryKey: ["admin-check", address],
    queryFn: async () => {
      if (!address) {
        return { is_admin: false };
      }
      const response = await adminService.checkAdmin(address);
      return response.data;
    },
    // /admin/check/:address requires a valid SIWE session (it's nested under
    // both Auth and AdminAuth middleware on the backend) - firing it before
    // sign-in just produces a 401, which reads as "not admin" even for a
    // wallet that genuinely is one.
    enabled: !!address && isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}
