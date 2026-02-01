import { Types } from "mongoose";
import { PermissionEntryDTO } from "./permission.dto";

export interface RoleAssignmentDTO {
  roleId: string;
  assignedAt: Date;
  assignedByUserId: string | Types.ObjectId;
}

export interface UserCustomPermissionDTO extends PermissionEntryDTO {
  grantedAt: Date;
  grantedByUserId: string | Types.ObjectId;
}

export interface UserDTO {
  _id: string | Types.ObjectId;
  email: string;
  isEmailVerified: boolean;
  name: string;
  roleAssignments: RoleAssignmentDTO[];
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED" | "PENDING_VERIFICATION";
  customPermissions: UserCustomPermissionDTO[];
  isActive: boolean;
  isDeleted: boolean;
  lastLogin?: Date | null;
  deletedAt: Date | null;
  effectivePermissions: unknown;
  invitationStatus: "invited" | "active" | "suspended";
  invitedByUserId?: string | null;
  invitedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export type CreateUserDTO = Pick<
  UserDTO,
  "email" | "name" | "roleAssignments" | "customPermissions"
>;

export type UpdateUserDTO = Partial<CreateUserDTO & Pick<UserDTO, "isActive">>;

export interface AssignRoleDTO {
  roleId: string;
}

export type GrantUserPermissionDTO = PermissionEntryDTO;
