import type { OrganizationRole } from "./types";

const roleHierarchy: Record<OrganizationRole, number> = {
  user: 0,
  admin: 1,
  owner: 2,
};

export const hasHigherOrEqualRole = ({
  currentRole,
  requiredRole,
}: {
  currentRole: OrganizationRole;
  requiredRole: OrganizationRole;
}) => {
  return roleHierarchy[currentRole] >= roleHierarchy[requiredRole];
};
