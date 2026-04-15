// Service for user assignments

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

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

// Helper to update ward status after assignment changes
async function updateWardStatusAfterAssignment(wardId: string, actingUserId?: string) {
  // Get total mohallas in ward
  const totalMohallas = await prisma.wardMohallaMapping.count({
    where: { wardId, isActive: true }
  });

  // Get assigned mohallas
  const assignments = await prisma.surveyorAssignment.findMany({
    where: { wardId, isActive: true },
    select: { mohallaIds: true }
  });
  const assignedMohallas = new Set(assignments.flatMap(a => a.mohallaIds));

  const unassignedCount = totalMohallas - assignedMohallas.size;

  // If there are unassigned mohallas, ensure status is STARTED
  if (unassignedCount > 0) {
    // Check if STARTED status exists
    const startedStatus = await prisma.wardStatusMaster.findFirst({
      where: { statusName: 'STARTED', isActive: true }
    });
    if (startedStatus) {
      // Upsert ward status to STARTED
      await prisma.wardStatusMapping.upsert({
        where: { wardId_wardStatusId: { wardId, wardStatusId: startedStatus.wardStatusId } },
        update: { isActive: true, changedById: actingUserId || 'system' },
        create: {
          wardId,
          wardStatusId: startedStatus.wardStatusId,
          changedById: actingUserId || 'system',
          isActive: true,
        },
      });
    }
  } else {
    // If all assigned, set to COMPLETED if exists
    const completedStatus = await prisma.wardStatusMaster.findFirst({
      where: { statusName: 'COMPLETED', isActive: true }
    });
    if (completedStatus) {
      // Deactivate other statuses and set to COMPLETED
      await prisma.wardStatusMapping.updateMany({
        where: { wardId },
        data: { isActive: false }
      });
      await prisma.wardStatusMapping.create({
        data: {
          wardId,
          wardStatusId: completedStatus.wardStatusId,
          changedById: actingUserId || 'system',
          isActive: true,
        },
      });
    }
  }
}

// Bulk assign users to wards/mohallas
export const bulkAssign = async (data: any) => {
  const { userId, assignmentType, assignments, assignedById } = data;
  const assigned: any[] = [];
  const conflicts: any[] = [];

  for (const assignment of assignments) {
    const { wardId, mohallaIds } = assignment;
    // Fetch all existing assignments for this ward
    const existingAssignments = await prisma.surveyorAssignment.findMany({
      where: { wardId, isActive: true },
      select: { mohallaIds: true, userId: true }
    });
    // Flatten all already assigned mohallaIds in this ward
    const alreadyAssignedMohallaIds = new Set(
      existingAssignments.flatMap(a => a.mohallaIds)
    );
    // Find mohallas that are not yet assigned
    const toAssign = mohallaIds.filter((id: string) => !alreadyAssignedMohallaIds.has(id));
    const conflictMohallas = mohallaIds.filter((id: string) => alreadyAssignedMohallaIds.has(id));

    if (toAssign.length > 0) {
      // Check if user already has an assignment for this ward
      const userAssignment = await prisma.surveyorAssignment.findFirst({
        where: { userId, wardId, isActive: true },
      });
      if (userAssignment) {
        // Merge mohallaIds (avoid duplicates)
        const newMohallaIds = Array.from(new Set([...userAssignment.mohallaIds, ...toAssign]));
        const old_value = { mohallaIds: userAssignment.mohallaIds };
        
        // If it's a developer or admin tool, we might need to keep the type, 
        // but here we follow the "first is primary, rest are secondary" rule
        // However, if it's already PRIMARY, keep it PRIMARY.
        const updatedAssignmentType = userAssignment.assignmentType === 'PRIMARY' ? 'PRIMARY' : 'SECONDARY';

        await prisma.surveyorAssignment.update({
          where: { assignmentId: userAssignment.assignmentId },
          data: { mohallaIds: newMohallaIds, assignmentType: updatedAssignmentType, assignedById },
        });
        const new_value = { mohallaIds: newMohallaIds };
        await logAudit({ userId: assignedById, action: 'Assignment updated', old_value, new_value });
      } else {
        // Check if user already has ANY active assignment
        const existingAnyAssignment = await prisma.surveyorAssignment.findFirst({
          where: { userId, isActive: true }
        });
        
        const finalAssignmentType = existingAnyAssignment ? 'SECONDARY' : 'PRIMARY';

        const newAssignment = await prisma.surveyorAssignment.create({
          data: {
            userId,
            assignmentType: finalAssignmentType,
            wardId,
            mohallaIds: toAssign,
            assignedById,
            isActive: true,
          },
        });
        await logAudit({ userId: assignedById, action: 'Assignment created', new_value: newAssignment });
      }
      assigned.push({ wardId, mohallaIds: toAssign });
    }
    if (conflictMohallas.length > 0) {
      conflicts.push({ wardId, mohallaIds: conflictMohallas });
    }
  }

  // Update ward status for affected wards
  const affectedWardIds = Array.from(new Set(assigned.map((a: any) => a.wardId)));
  for (const wardId of affectedWardIds) {
    await updateWardStatusAfterAssignment(wardId, assignedById);
  }

  return { success: true, assigned, conflicts };
};

// Get all assignments for a user
export const getAssignmentsByUser = async (userId: string) => {
  // First, let's directly query WardMaster to see what's in the DB
  const sampleWard = await prisma.wardMaster.findFirst({
    where: { wardName: 'Test Ward' },
    select: {
      wardId: true,
      wardName: true,
      newWardNumber: true,
      oldWardNumber: true,
      wardCode: true,
    }
  });
  console.log('[AssignmentService] Direct WardMaster query for "Test Ward":');
  console.log('  Result:', JSON.stringify(sampleWard, null, 2));
  
  const assignments = await prisma.surveyorAssignment.findMany({
    where: { userId },
    include: {
      ward: {
        select: {
          wardId: true,
          wardName: true,
          newWardNumber: true,
          oldWardNumber: true,
          wardCode: true,
          isActive: true,
          description: true,
          createdAt: true,
          updatedAt: true,
        }
      },
    },
  });
  
  // DEBUG: Log what we're getting from database
  console.log('[AssignmentService] Raw assignments from DB:');
  assignments.forEach(a => {
    console.log(`  Assignment ID: ${a.assignmentId}`);
    console.log(`    Ward ID: ${a.wardId}`);
    console.log(`    Ward object keys:`, Object.keys(a.ward));
    console.log(`    Ward.newWardNumber: ${a.ward.newWardNumber}`);
    console.log(`    Ward.oldWardNumber: ${a.ward.oldWardNumber}`);
    console.log(`    Ward.wardName: ${a.ward.wardName}`);
    console.log(`    Full Ward object:`, JSON.stringify(a.ward));
  });
  
  // For each assignment, fetch mohalla details
  const result = await Promise.all(assignments.map(async (a) => {
    const mohallas = await prisma.mohallaMaster.findMany({
      where: { mohallaId: { in: a.mohallaIds } },
    });
    return {
      ward: a.ward,
      mohallas,
      assignmentType: a.assignmentType,
      assignmentId: a.assignmentId,
      isActive: a.isActive,
    };
  }));
  return { assignments: result };
};

// Get all assignments for a ward
export const getAssignmentsByWard = async (wardId: string) => {
  const assignments = await prisma.surveyorAssignment.findMany({
    where: { wardId, isActive: true },
    include: {
      user: true,
    },
  });
  // For each assignment, return user and mohallaIds
  const result = assignments.map(a => ({
    user: {
      userId: a.user.userId,
      name: a.user.name,
      username: a.user.username,
    },
    mohallaIds: a.mohallaIds,
    assignmentType: a.assignmentType,
    assignmentId: a.assignmentId,
  }));
  return { assignments: result };
};

// Update isActive for an assignment
export const updateAssignmentStatus = async (assignmentId: string, isActive: boolean, actingUserId?: string) => {
  const oldAssignment = await prisma.surveyorAssignment.findUnique({ where: { assignmentId } });
  if (!oldAssignment) throw new Error('Assignment not found');

  // If deactivating, check for survey data
  if (!isActive) {
    const surveyCount = await prisma.surveyDetails.count({
      where: {
        uploadedById: oldAssignment.userId,
        wardId: oldAssignment.wardId,
        mohallaId: { in: oldAssignment.mohallaIds }
      }
    });

    if (surveyCount > 0) {
      throw new Error(`Cannot deactivate assignment: ${surveyCount} surveys already submitted for this ward/mohalla.`);
    }
  }

  const updated = await prisma.surveyorAssignment.update({
    where: { assignmentId },
    data: { isActive },
  });
  await logAudit({ userId: actingUserId || updated.userId, action: `Assignment ${isActive ? 'activated' : 'deactivated'}`, old_value: oldAssignment, new_value: updated });
  return updated;
};

// Delete an assignment (hard delete)
export const deleteAssignment = async (assignmentId: string, actingUserId?: string) => {
  const oldAssignment = await prisma.surveyorAssignment.findUnique({ where: { assignmentId } });
  if (!oldAssignment) throw new Error('Assignment not found');

  // Check for survey data before deletion
  const surveyCount = await prisma.surveyDetails.count({
    where: {
      uploadedById: oldAssignment.userId,
      wardId: oldAssignment.wardId,
      mohallaId: { in: oldAssignment.mohallaIds }
    }
  });

  if (surveyCount > 0) {
    throw new Error(`Cannot delete assignment: ${surveyCount} surveys already submitted for this ward/mohalla. You can only deactivate it if permitted.`);
  }

  const wardId = oldAssignment?.wardId;
  await prisma.surveyorAssignment.delete({
    where: { assignmentId },
  });
  await logAudit({ userId: actingUserId || (oldAssignment?.userId ?? ''), action: 'Assignment deleted', old_value: oldAssignment });

  // Update ward status after deletion
  if (wardId) {
    await updateWardStatusAfterAssignment(wardId, actingUserId);
  }

  return { success: true };
};

// Get all assignments (admin view)
export const getAllAssignments = async () => {
  const assignments = await prisma.surveyorAssignment.findMany({
    include: {
      user: true,
      ward: true,
      assignedBy: true,
    },
  });
  // For each assignment, fetch mohalla details
  const result = await Promise.all(assignments.map(async (a) => {
    const mohallas = await prisma.mohallaMaster.findMany({
      where: { mohallaId: { in: a.mohallaIds } },
    });
    return {
      user: {
        userId: a.user.userId,
        name: a.user.name,
        username: a.user.username,
      },
      ward: a.ward,
      mohallas,
      assignedBy: a.assignedBy ? {
        userId: a.assignedBy.userId,
        name: a.assignedBy.name,
        username: a.assignedBy.username,
      } : null,
      isActive: a.isActive,
      assignmentType: a.assignmentType,
      assignmentId: a.assignmentId,
    };
  }));
  return { assignments: result };
}; 