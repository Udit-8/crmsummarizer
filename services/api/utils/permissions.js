// Define permissions for each role
const rolePermissions = {
    AGENT: ['read_leads', 'update_lead_status'],
    MANAGER: ['read_leads', 'assign_leads', 'view_team_performance'],
    ADMIN: ['read_leads', 'assign_leads', 'manage_users', 'system_configuration'],
    COMPLIANCE: ['read_leads', 'audit_logs', 'compliance_reports']
  };
  
  // Define role hierarchy for permission inheritance
  const roleHierarchy = {
    ADMIN: ['MANAGER', 'AGENT', 'COMPLIANCE'],
    MANAGER: ['AGENT'],
    COMPLIANCE: [],
    AGENT: []
  };
  
  // Check if a role has a specific permission
  function hasPermission(role, permission) {
    if (!role || !permission) return false;
    return rolePermissions[role]?.includes(permission) || false;
  }
  
  // Check permissions with inheritance
  function hasPermissionWithInheritance(role, permission) {
    // Check direct permissions first
    if (hasPermission(role, permission)) return true;
  
    // Check inherited permissions
    for (const inheritedRole of roleHierarchy[role] || []) {
      if (hasPermission(inheritedRole, permission)) return true;
    }
    return false;
  }
  
  // Get all permissions for a role (including inherited)
  function getAllPermissions(role) {
    let allPermissions = [...(rolePermissions[role] || [])];
    
    // Add inherited permissions
    for (const inheritedRole of roleHierarchy[role] || []) {
      allPermissions = [...allPermissions, ...(rolePermissions[inheritedRole] || [])];
    }
    
    // Remove duplicates
    return [...new Set(allPermissions)];
  }
  
  module.exports = {
    rolePermissions,
    hasPermission,
    hasPermissionWithInheritance,
    getAllPermissions
  };