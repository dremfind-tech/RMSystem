import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { supabaseAdmin } from '../utils/supabase';

// Extend Express Request type
declare global {
    namespace Express {
        interface Request {
            user?: any;
            userRole?: string;
        }
    }
}

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'No authorization header' });
    }

    const token = authHeader.split(' ')[1];
    // Prioritize SUPABASE_JWT_SECRET as it is standard in Supabase Vercel integration
    const secret = process.env.SUPABASE_JWT_SECRET || process.env.JWT_SECRET;

    if (!secret) {
        console.error('FATAL: No JWT Secret (SUPABASE_JWT_SECRET or JWT_SECRET) provided in environment variables.');
        return res.status(500).json({ error: 'Server misconfiguration: missing auth secret' });
    }

    try {
        // 1. Verify JWT
        const decoded: any = jwt.verify(token, secret);
        req.user = decoded;

        // 2. Get User Role (Fetch from DB to be sure, or rely on metadata if synced)
        // We will fetch from the 'user_roles' table we defined.
        // Use supabaseAdmin to bypass RLS for this system check
        const { data, error } = await supabaseAdmin
            .from('user_roles')
            .select('role')
            .eq('user_id', decoded.sub)
            .single();

        if (error || !data) {
            // Fallback or explicit error? 
            // If no role assigned, maybe just authenticated user? 
            // Requirement implies specific roles.
            console.error(`User ${decoded.sub} has no role assigned. DB Error: ${error?.message}`);
            return res.status(403).json({ error: 'User has no assigned role' });
        }

        req.userRole = data.role;
        next();
    } catch (error) {
        console.error('Auth Error:', error);
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

export const requireRole = (roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }
        next();
    };
};
