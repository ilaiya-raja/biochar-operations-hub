
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabase';
import { Leaf } from 'lucide-react';
import { toast } from 'sonner';
import { Spinner } from '@/components/Spinner';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for access token in URL when component mounts
  useEffect(() => {
    const setupSession = async () => {
      try {
        // Get the URL hash parameters
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');

        if (!accessToken || !refreshToken) {
          toast.error('Invalid reset password link');
          navigate('/login');
          return;
        }

        // Set the session
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });

        if (sessionError) {
          console.error('Session error:', sessionError);
          toast.error('Invalid or expired reset password link');
          navigate('/login');
        }
      } catch (error) {
        console.error('Session setup error:', error);
        toast.error('Failed to verify reset password link');
        navigate('/login');
      }
    };

    setupSession();
  }, [navigate]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Starting password reset process...');
    
    if (password !== confirmPassword) {
      console.log('Password validation failed: passwords do not match');
      toast.error('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      console.log('Password validation failed: password too short');
      toast.error('Password must be at least 6 characters');
      return;
    }

    setIsLoading(true);
    console.log('Attempting to reset user password...');
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      console.log('Current user:', user?.id);

      if (!user) {
        throw new Error('No authenticated user found');
      }

      const { error } = await supabase.auth.updateUser({
        password: password
      });

      if (error) {
        console.error('Error updating password:', error);
        toast.error(error.message);
      } else {
        console.log('Password reset successful');
        toast.success('Password updated successfully');
        navigate('/login');
      }
    } catch (error) {
      console.error('Error in password reset process:', error);
      toast.error('Failed to update password');
    } finally {
      setIsLoading(false);
      console.log('Password reset process completed');
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-biochar-50 to-biochar-200 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-2 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-biochar-500 text-white">
            <Leaf className="h-6 w-6" />
          </div>
          <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
          <CardDescription>
            Enter your new password below
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleResetPassword}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password"
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
                placeholder="Confirm new password"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? <Spinner size="sm" className="mr-2" /> : null}
              Reset Password
            </Button>
          </CardContent>
        </form>
      </Card>
    </div>
  );
};

export default ResetPassword;
