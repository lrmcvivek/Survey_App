import { PrismaClient, Prisma } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  UpdateProfileDto,
  ChangePasswordDto,
  GetUsersDto,
  UpdateUserStatusDto,
  DeleteUserDto,
  AssignRoleDto,
  RemoveRoleDto,
  GetUserStatsDto,
  GetUserActivityDto,
  SearchUsersDto,
  UpdateUserDto,
} from '../dtos/userDto';

const prisma = new PrismaClient();

// Role hierarchy ranking (higher number = higher authority)
const ROLE_RANK: { [key: string]: number } = {
  SUPERADMIN: 4,
  ADMIN: 3,
  SUPERVISOR: 2,
  SURVEYOR: 1,
  VIEWER: 0,
};

// Helper function to get user's highest role rank
async function getUserRoleRank(userId: string): Promise<number> {
  const mappings = await prisma.userRoleMapping.findMany({
    where: { userId, isActive: true },
    include: { role: true },
  });

  if (!mappings || mappings.length === 0) {
    return 0; // No role assigned
  }

  // Return the highest role rank
  return Math.max(...mappings.map((m) => ROLE_RANK[m.role.roleName] || 0));
}

// Helper function to check if requesting user can manage target user
async function canManageUser(requestingUserId: string, targetUserId: string): Promise<boolean> {
  const requestingUserRank = await getUserRoleRank(requestingUserId);
  const targetUserRank = await getUserRoleRank(targetUserId);

  // User can only manage users with lower role rank
  return requestingUserRank > targetUserRank;
}

// Helper function to validate user role
async function validateUserRole(userId: string, expectedRole: string) {
  const mapping = await prisma.userRoleMapping.findFirst({
    where: { userId, isActive: true },
    include: { role: true },
  });
  if (!mapping || mapping.role.roleName !== expectedRole) {
    throw { status: 400, message: `Invalid ${expectedRole.toLowerCase()}` };
  }
  return mapping;
}

// Helper to log audit actions
async function logAudit({ userId, action, old_value, new_value }: { userId: string, action: string, old_value?: any, new_value?: any }) {
  await prisma.auditLog.create({
    data: {
      userId,
      action,
      old_value: old_value ? JSON.stringify(old_value) : undefined,
      new_value: new_value ? JSON.stringify(new_value) : undefined,
    },
  });
}

// 1. Update User Profile
export async function updateProfile(dto: UpdateProfileDto, userId: string) {
  const { name, mobileNumber } = dto;

  try {
    const user = await prisma.usersMaster.findUnique({
      where: { userId },
      include: {
        userRoleMaps: {
          where: { isActive: true },
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    const updateData: any = {};
    if (mobileNumber) updateData.mobileNumber = mobileNumber;
    if (name) updateData.name = name;

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update UsersMaster
      const updatedUser = await tx.usersMaster.update({
        where: { userId },
        data: updateData,
      });

      // Update role-specific table
      const userRole = user.userRoleMaps[0]?.role.roleName;
      if (userRole === 'SURVEYOR' && name) {
        await tx.surveyors.update({
          where: { userId },
          data: { surveyorName: name },
        });
      } else if (userRole === 'SUPERVISOR' && name) {
        await tx.supervisors.update({
          where: { userId },
          data: { supervisorName: name },
        });
      } else if ((userRole === 'ADMIN' || userRole === 'SUPERADMIN') && name) {
        await tx.admins.update({
          where: { userId },
          data: { adminName: name },
        });
      }

      return updatedUser;
    });

    return {
      userId: result.userId,
      username: result.username,
      name: result.name,
      mobileNumber: result.mobileNumber,
      status: 'Profile updated successfully',
    };
  } catch (err: any) {
    if (!err.status) console.error(err);
    throw err.status ? err : { status: 500, message: 'Internal server error' };
  }
}

// 2. Change Password
export async function changePassword(dto: ChangePasswordDto, userId: string) {
  const { currentPassword, newPassword } = dto;

  try {
    const user = await prisma.usersMaster.findUnique({
      where: { userId },
    });

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, user.password);
    if (!isValidPassword) {
      throw { status: 400, message: 'Current password is incorrect' };
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update UsersMaster
      await tx.usersMaster.update({
        where: { userId },
        data: { password: hashedPassword },
      });

      // Update role-specific table
      const userRole = await tx.userRoleMapping.findFirst({
        where: { userId, isActive: true },
        include: { role: true },
      });

      if (userRole?.role.roleName === 'SURVEYOR') {
        await tx.surveyors.update({
          where: { userId },
          data: { password: hashedPassword },
        });
      } else if (userRole?.role.roleName === 'SUPERVISOR') {
        await tx.supervisors.update({
          where: { userId },
          data: { password: hashedPassword },
        });
      } else if (userRole?.role.roleName === 'ADMIN' || userRole?.role.roleName === 'SUPERADMIN') {
        await tx.admins.update({
          where: { userId },
          data: { password: hashedPassword },
        });
      }

      return { userId, status: 'Password changed successfully' };
    });

    return result;
  } catch (err: any) {
    if (!err.status) console.error(err);
    throw err.status ? err : { status: 500, message: 'Internal server error' };
  }
}

// 3. Get Users (with pagination and filtering)
export async function getUsers(dto: GetUsersDto, requestingUserId: string) {
  const { role, isActive, search, page, limit } = dto;

  try {
    // Validate requesting user has permission
    const requestingUser = await prisma.userRoleMapping.findFirst({
      where: { userId: requestingUserId, isActive: true },
      include: { role: true },
    });

    if (!requestingUser) {
      throw { status: 401, message: 'Unauthorized' };
    }

    // Build where clause
    const whereClause: any = {};
    
    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    if (search) {
      whereClause.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { mobileNumber: { contains: search } },
      ];
    }

    // If role filter is specified, include role mapping
    let includeClause: any = {
      userRoleMaps: {
        where: { isActive: true },
        include: { role: true },
      },
    };

    if (role) {
      includeClause.userRoleMaps.where.role = { roleName: role };
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.usersMaster.findMany({
        where: whereClause,
        include: includeClause,
        skip,
        take: limit,
        orderBy: { username: 'asc' },
      }),
      prisma.usersMaster.count({ where: whereClause }),
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  } catch (err: any) {
    if (!err.status) console.error(err);
    throw err.status ? err : { status: 500, message: 'Internal server error' };
  }
}

// 4. Update User Status
export async function updateUserStatus(dto: UpdateUserStatusDto, updatedById: string) {
  const { userId, isActive, reason } = dto;

  try {
    // Validate user exists
    const user = await prisma.usersMaster.findUnique({
      where: { userId },
      include: {
        userRoleMaps: {
          where: { isActive: true },
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // Prevent deactivating own account
    if (userId === updatedById && !isActive) {
      throw { status: 400, message: 'Cannot deactivate your own account' };
    }

    // Check role hierarchy - user can only manage users with lower roles
    const canManage = await canManageUser(updatedById, userId);
    if (!canManage) {
      throw { status: 403, message: 'Access denied. You can only manage users with lower roles than yours.' };
    }

    const old_value = { isActive: user.isActive };
    const result = await prisma.usersMaster.update({
      where: { userId },
      data: { isActive },
    });
    const new_value = { isActive };
    await logAudit({ userId: updatedById, action: `User status ${isActive ? 'activated' : 'deactivated'}`, old_value, new_value });

    return {
      userId,
      isActive,
      reason,
      status: 'User status updated successfully',
    };
  } catch (err: any) {
    if (!err.status) console.error(err);
    throw err.status ? err : { status: 500, message: 'Internal server error' };
  }
}

// 5. Delete User (Soft delete)
export async function deleteUser(dto: DeleteUserDto, deletedById: string) {
  const { userId, reason, hardDelete } = dto;

  try {
    // Validate user exists
    const user = await prisma.usersMaster.findUnique({
      where: { userId },
    });

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // Prevent deleting own account
    if (userId === deletedById) {
      throw { status: 400, message: 'Cannot delete your own account' };
    }

    // Check role hierarchy - user can only manage users with lower roles
    const canManage = await canManageUser(deletedById, userId);
    if (!canManage) {
      throw { status: 403, message: 'Access denied. You can only manage users with lower roles than yours.' };
    }

    if (hardDelete) {
      // Hard delete: remove user and all related data
      const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // Remove from role-specific tables
        await tx.userRoleMapping.deleteMany({ where: { userId } });
        await tx.surveyors.deleteMany({ where: { userId } });
        await tx.supervisors.deleteMany({ where: { userId } });
        await tx.admins.deleteMany({ where: { userId } });
        // Remove user
        await tx.usersMaster.delete({ where: { userId } });
        return { userId, reason, status: 'User hard deleted successfully' };
      });
      await logAudit({ userId: deletedById, action: 'User hard deleted', old_value: user, new_value: null });
      return result;
    }

    // Soft delete user (default)
    const old_value = { isActive: user.isActive };
    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Soft delete user
      await tx.usersMaster.update({
        where: { userId },
        data: { isActive: false },
      });
      // Deactivate role mapping
      await tx.userRoleMapping.updateMany({
        where: { userId },
        data: { isActive: false },
      });
      return { userId, reason, status: 'User deleted successfully' };
    });
    const new_value = { isActive: false };
    await logAudit({ userId: deletedById, action: 'User deleted', old_value, new_value });
    return result;
  } catch (err: any) {
    if (!err.status) console.error(err);
    throw err.status ? err : { status: 500, message: 'Internal server error' };
  }
}

// 6. Assign Role to User
export async function assignRole(dto: AssignRoleDto, assignedById: string) {
  const { userId, role, reason } = dto;

  try {
    // Validate user exists
    const user = await prisma.usersMaster.findUnique({
      where: { userId },
    });

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // Get role info
    const roleInfo = await prisma.rolePermissionMaster.findUnique({
      where: { roleName: role },
    });

    if (!roleInfo) {
      throw { status: 400, message: 'Invalid role' };
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Remove existing role mappings
      await tx.userRoleMapping.updateMany({
        where: { userId },
        data: { isActive: false },
      });

      // Create new role mapping
      await tx.userRoleMapping.create({
        data: {
          userId,
          roleId: roleInfo.roleId,
          isActive: true,
        },
      });

      // Create role-specific table entry
      if (role === 'SURVEYOR') {
        await tx.surveyors.upsert({
          where: { userId },
          update: {},
          create: {
            userId,
            surveyorName: user.description || user.username,
            username: user.username,
            password: user.password,
          },
        });
      } else if (role === 'SUPERVISOR') {
        await tx.supervisors.upsert({
          where: { userId },
          update: {},
          create: {
            userId,
            supervisorName: user.description || user.username,
            username: user.username,
            password: user.password,
          },
        });
      } else if (role === 'ADMIN' || role === 'SUPERADMIN') {
        await tx.admins.upsert({
          where: { userId },
          update: {},
          create: {
            userId,
            adminName: user.description || user.username,
            username: user.username,
            password: user.password,
          },
        });
      }

      return { userId, role, reason, status: 'Role assigned successfully' };
    });

    return result;
  } catch (err: any) {
    if (!err.status) console.error(err);
    throw err.status ? err : { status: 500, message: 'Internal server error' };
  }
}

// 7. Remove Role from User
export async function removeRole(dto: RemoveRoleDto, removedById: string) {
  const { userId, reason } = dto;

  try {
    // Validate user exists
    const user = await prisma.usersMaster.findUnique({
      where: { userId },
      include: {
        userRoleMaps: {
          where: { isActive: true },
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    if (user.userRoleMaps.length === 0) {
      throw { status: 400, message: 'User has no active roles' };
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Deactivate role mappings
      await tx.userRoleMapping.updateMany({
        where: { userId },
        data: { isActive: false },
      });

      // Remove from role-specific tables
      const userRole = user.userRoleMaps[0]?.role.roleName;
      if (userRole === 'SURVEYOR') {
        await tx.surveyors.delete({ where: { userId } });
      } else if (userRole === 'SUPERVISOR') {
        await tx.supervisors.delete({ where: { userId } });
      } else if (userRole === 'ADMIN' || userRole === 'SUPERADMIN') {
        await tx.admins.delete({ where: { userId } });
      }

      return { userId, reason, status: 'Role removed successfully' };
    });

    return result;
  } catch (err: any) {
    if (!err.status) console.error(err);
    throw err.status ? err : { status: 500, message: 'Internal server error' };
  }
}

// 8. Get User Statistics
export async function getUserStats(dto: GetUserStatsDto) {
  const { role, wardId, dateFrom, dateTo } = dto;

  try {
    const whereClause: any = {};
    
    if (role) {
      whereClause.userRoleMaps = {
        some: {
          isActive: true,
          role: { roleName: role },
        },
      };
    }

    if (dateFrom || dateTo) {
      whereClause.isCreatedAt = {};
      if (dateFrom) whereClause.isCreatedAt.gte = new Date(dateFrom);
      if (dateTo) whereClause.isCreatedAt.lte = new Date(dateTo);
    }

    const [totalUsers, activeUsers, inactiveUsers] = await Promise.all([
      prisma.usersMaster.count({ where: whereClause }),
      prisma.usersMaster.count({ where: { ...whereClause, isActive: true } }),
      prisma.usersMaster.count({ where: { ...whereClause, isActive: false } }),
    ]);

    // Role-wise statistics
    const roleStats = await prisma.userRoleMapping.groupBy({
      by: ['roleId'],
      where: { isActive: true },
      _count: { userId: true },
    });

    // Get role names for the statistics
    const roleIds = roleStats.map((stat: any) => stat.roleId);
    const roles = await prisma.rolePermissionMaster.findMany({
      where: { roleId: { in: roleIds } },
      select: { roleId: true, roleName: true },
    });

    const roleMap = new Map(roles.map((role: any) => [role.roleId, role.roleName]));

    return {
      totalUsers,
      activeUsers,
      inactiveUsers,
      roleStats: roleStats.map((stat: any) => ({
        role: roleMap.get(stat.roleId) || 'Unknown',
        count: stat._count.userId,
      })),
    };
  } catch (err: any) {
    if (!err.status) console.error(err);
    throw err.status ? err : { status: 500, message: 'Internal server error' };
  }
}

// 9. Search Users
export async function searchUsers(dto: SearchUsersDto) {
  const { query, role, isActive, limit } = dto;

  try {
    const whereClause: any = {
      OR: [
        { username: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
        { mobileNumber: { contains: query } },
      ],
    };

    if (isActive !== undefined) {
      whereClause.isActive = isActive;
    }

    if (role) {
      whereClause.userRoleMaps = {
        some: {
          isActive: true,
          role: { roleName: role },
        },
      };
    }

    const users = await prisma.usersMaster.findMany({
      where: whereClause,
      include: {
        userRoleMaps: {
          where: { isActive: true },
          include: { role: true },
        },
      },
      take: limit,
      orderBy: { username: 'asc' },
    });

    return { users };
  } catch (err: any) {
    if (!err.status) console.error(err);
    throw err.status ? err : { status: 500, message: 'Internal server error' };
  }
}

// 10. Get User Profile
export async function getUserProfile(userId: string) {
  try {
    const user = await prisma.usersMaster.findUnique({
      where: { userId },
      include: {
        userRoleMaps: {
          where: { isActive: true },
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    return {
      userId: user.userId,
      username: user.username,
      name: user.name,
      mobileNumber: user.mobileNumber,
      isActive: user.isActive,
      role: user.userRoleMaps[0]?.role.roleName || null,
      createdAt: user.isCreatedAt,
    };
  } catch (err: any) {
    if (!err.status) console.error(err);
    throw err.status ? err : { status: 500, message: 'Internal server error' };
  }
}

// 9. Update User (for admin purposes)
export async function updateUser(dto: UpdateUserDto, updatedById: string) {
  const { userId, name, mobileNumber, password } = dto;

  try {
    // Validate user exists
    const user = await prisma.usersMaster.findUnique({
      where: { userId },
      include: {
        userRoleMaps: {
          where: { isActive: true },
          include: { role: true },
        },
      },
    });

    if (!user) {
      throw { status: 404, message: 'User not found' };
    }

    // Check role hierarchy - user can only manage users with lower roles
    const canManage = await canManageUser(updatedById, userId);
    if (!canManage) {
      throw { status: 403, message: 'Access denied. You can only manage users with lower roles than yours.' };
    }

    const updateData: any = {};
    if (mobileNumber) updateData.mobileNumber = mobileNumber;
    if (name) updateData.name = name;
    if (password) {
      // Hash password before saving
      updateData.password = await bcrypt.hash(password, 10);
    }

    const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // Update UsersMaster
      const updatedUser = await tx.usersMaster.update({
        where: { userId },
        data: updateData,
      });

      // Update role-specific table
      const userRole = user.userRoleMaps[0]?.role.roleName;
      if (userRole === 'SURVEYOR' && name) {
        await tx.surveyors.update({
          where: { userId },
          data: { surveyorName: name },
        });
      } else if (userRole === 'SUPERVISOR' && name) {
        await tx.supervisors.update({
          where: { userId },
          data: { supervisorName: name },
        });
      } else if ((userRole === 'ADMIN' || userRole === 'SUPERADMIN') && name) {
        await tx.admins.update({
          where: { userId },
          data: { adminName: name },
        });
      }

      return updatedUser;
    });
    const new_value = { name, mobileNumber, password: password ? '***' : undefined };
    await logAudit({ userId: updatedById, action: 'User updated', old_value: { name: user.name, mobileNumber: user.mobileNumber }, new_value });

    return { userId, status: 'User updated successfully' };
  } catch (err: any) {
    if (err.status && err.message) throw err;
    console.error(err);
    throw { status: 500, message: 'Internal server error' };
  }
} 