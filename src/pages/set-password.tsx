import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Spinner } from '@/components/ui/spinner';

const SetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const setupSession = async () => {
      try {
        console.log('Starting session setup...');
        
        // Get the URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('URL parameters:', { type, hasAccessToken: !!accessToken, hasRefreshToken: !!refreshToken });

        if (!accessToken || !refreshToken) {
          console.error('Missing tokens in URL');
          toast.error('Invalid invitation link');
          navigate('/login');
          return;
        }

        // Set the session
        console.log('Setting up session with tokens...', {
          accessTokenLength: accessToken?.length,
          refreshTokenLength: refreshToken?.length
        });
        const { data: sessionData, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        console.log('Session setup result:', {
          success: !sessionError,
          error: sessionError,
          hasSessionData: !!sessionData,
          user: sessionData?.user?.id
        });

        if (sessionError) {
          console.error('Session setup error:', sessionError);
          toast.error('Invalid or expired invitation link');
          navigate('/login');
          return;
        }

        // Verify the session was set correctly
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          console.error('User verification failed:', userError);
          toast.error('Failed to verify user session');
          navigate('/login');
          return;
        }

        console.log('Session setup successful for user:', user.id);
      } catch (error) {
        console.error('Session setup error:', error);
        toast.error('Failed to verify invitation link');
        navigate('/login');
      }
    };

    setupSession();
  }, [navigate]);

  const handleSetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    console.log('Starting password update process...');

    try {
      // Verify user is authenticated
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      console.log('Current session:', { hasSession: !!session, sessionError });

      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', { hasUser: !!user, userError, userId: user?.id });

      if (userError || !user || !session) {
        console.error('Authentication check failed:', { userError, sessionError });
        toast.error('Please use a valid invitation link');
        navigate('/login');
        return;
      }

      console.log('User verified, proceeding with password update...');

      // Validate password requirements
      if (password !== confirmPassword) {
        console.log('Password mismatch');
        toast.error('Passwords do not match');
        setLoading(false);
        return;
      }

      if (password.length < 6) {
        console.log('Password too short');
        toast.error('Password must be at least 6 characters');
        setLoading(false);
        return;
      }

      console.log('Password validation passed, updating user password...');
      console.log('Calling supabase.auth.updateUser with password length:', password.length);
      const { data: updateData, error: updateError } = await supabase.auth.updateUser({ password });
      console.log('Update response:', { success: !updateError, error: updateError, hasData: !!updateData });

      if (updateError) {
        console.error('Password update failed:', updateError);
        toast.error(updateError.message || 'Failed to set password');
      } else {
        console.log('Password updated successfully');
        toast.success('Password set successfully');
        navigate('/login');
      }
    } catch (error) {
      console.error('Unexpected error during password update:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <CardTitle className="text-2xl font-bold">Set Your Password</CardTitle>
          <CardDescription>
            Please set a password for your coordinator account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm your password"
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-biochar-600 hover:bg-biochar-700"
              disabled={loading}
            >
              {loading ? <Spinner size="sm" className="mr-2" /> : null}
              {loading ? 'Setting Password...' : 'Set Password'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default SetPassword;