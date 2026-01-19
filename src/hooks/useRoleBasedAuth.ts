import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'ADMIN' | 'SCHOOL_USER' | 'OPERATOR' | 'SUPERVISOR' | 'AUDITOR' | 'AGENT';

interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  country?: string;
  region?: string;
  district?: string;
  phone_number?: string;
}

export function useRoleBasedAuth() {
  const { user, loading } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setProfileLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!loading && !profileLoading && user && profile) {
      redirectToCorrectPortal();
    }
  }, [loading, profileLoading, user, profile, location.pathname]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setProfileLoading(false);
    }
  };

  const redirectToCorrectPortal = () => {
    if (!profile) return;

    const currentPath = location.pathname;
    
    // Don't redirect if already on the correct portal
    if (isOnCorrectPortal(profile.role, currentPath)) return;

    // Redirect based on role
    switch (profile.role) {
      case 'ADMIN':
        navigate('/admin/dashboard', { replace: true });
        break;
      case 'SCHOOL_USER':
        navigate('/school/dashboard', { replace: true });
        break;
      case 'AUDITOR':
      case 'OPERATOR':
      case 'SUPERVISOR':
        navigate('/auditor', { replace: true });
        break;
      case 'AGENT':
        navigate('/agent', { replace: true });
        break;
      default:
        navigate('/auth', { replace: true });
    }
  };

  const isOnCorrectPortal = (role: UserRole, path: string): boolean => {
    switch (role) {
      case 'ADMIN':
        return path.startsWith('/admin/');
      case 'AGENT':
        return path.startsWith('/agent');
      case 'SCHOOL_USER':
        return path.startsWith('/school/');
      case 'AUDITOR':
      case 'OPERATOR':
      case 'SUPERVISOR':
        return path.startsWith('/auditor');
      default:
        return false;
    }
  };

  const hasAccess = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!profile) return false;
    
    const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    return roles.includes(profile.role);
  };

  return {
    user,
    profile,
    loading: loading || profileLoading,
    hasAccess,
    isOnCorrectPortal: profile ? isOnCorrectPortal(profile.role, location.pathname) : false
  };
}