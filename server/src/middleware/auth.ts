import { Request, Response, NextFunction } from 'express';
import { supabase } from '../db/supabase';

export interface AuthenticatedRequest extends Request {
    userId?: string;
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
