/**
 * @file auth.ts
 * @description Express middleware for JWT authentication and role-based authorization.
 *
 * ## Middleware
 *
 * ### `requireAuth`
 * - Extracts `Bearer <token>` from the Authorization header
 * - Validates the JWT via Supabase `auth.getUser(token)`
 * - Looks up `user_roles` to get `role` and `club_id`
 * - Attaches `userId`, `userEmail`, `userRole`, `userClubId` to the request
 * - Returns 401 if token is missing/invalid, 403 if no role row exists
 *
 * ### `requireRoot`
 * Chains `requireAuth` then additionally checks `userRole === 'root'`.
 * Returns 403 if the user is not the root admin.
 *
 * ## AuthenticatedRequest
 * Extends `express.Request` with the populated auth fields. Used throughout
 * index.ts to access `req.userRole`, `req.userClubId`, etc. in route handlers.
 *
 * ## DB Role Mapping
 * | DB role    | Frontend role  | Access level                    |
 * |------------|----------------|---------------------------------|
 * | `root`     | `admin`        | All clubs, all events, admin UI |
 * | `club_admin` | `club_officer` | Own club only                |
 */
import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';

export interface AuthenticatedRequest extends Request {
    userId?: string;
    userEmail?: string;
    userRole?: string;
    userClubId?: string | null;
}

export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Missing or invalid Authorization header' });
    }

    const token = authHeader.split(' ')[1];

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // Fetch the user's role from user_roles table
    const { data: roleRow, error: roleError } = await supabase
        .from('user_roles')
        .select('role, club_id')
        .eq('user_id', user.id)
        .single();

    if (roleError || !roleRow) {
        return res.status(403).json({ error: 'No role assigned to this user' });
    }

    req.userId = user.id;
    req.userEmail = user.email ?? '';
    req.userRole = roleRow.role;
    req.userClubId = roleRow.club_id ?? null;

    next();
};

export const requireRoot = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    await requireAuth(req, res, () => {
        if (req.userRole !== 'root') {
            return res.status(403).json({ error: 'Root admin access required' });
        }
        next();
    });
};
