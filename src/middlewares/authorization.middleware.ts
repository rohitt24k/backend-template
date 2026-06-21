import { Request, Response, NextFunction } from "express";
import { ForbiddenError } from "../errors";
import { UserRole } from "../constants/roles";
import { User } from "../models/user.model";

export function AuthorizationMiddleware(requiredRole: UserRole) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { userId } = res.locals.user as { userId: string; sessionId: string };

      const user = await User.findById(userId).select("role");

      if (!user) {
        throw new ForbiddenError("User not found");
      }

      const roleHierarchy: UserRole[] = ["USER", "ADMIN"];
      const userRoleIndex = roleHierarchy.indexOf(user.role);
      const requiredRoleIndex = roleHierarchy.indexOf(requiredRole);

      if (userRoleIndex < requiredRoleIndex) {
        throw new ForbiddenError("Insufficient permissions");
      }

      next();
    } catch (error) {
      next(error);
    }
  };
}
