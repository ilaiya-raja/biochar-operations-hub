
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { Spinner } from '@/components/Spinner';
import { Leaf } from 'lucide-react';
import { authService } from '@/lib/supabase';
import { toast } from 'sonner';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const { login, user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isForgotPassword) {
      if (!email) {
        setErrorMsg('Please enter your email address');
        return;
      }

      setIsSubmitting(true);
      setErrorMsg(null);
      
      try {
        const { error } = await authService.resetPassword(email);
        
        if (error) {
          setErrorMsg(error.message || 'Failed to send password reset email');
        } else {
          setResetEmailSent(true);
          toast.success('Password reset email sent. Please check your inbox.');
        }
      } catch (error) {
        setErrorMsg('An unexpected error occurred. Please try again.');
        console.error('Reset password error:', error);
      } finally {
        setIsSubmitting(false);
      }
      return;
    }
    
    if (!email || !password) {
      setErrorMsg('Please enter both email and password');
      return;
    }
    
    setIsSubmitting(true);
    setErrorMsg(null);
    
    try {
      if (isSignUp) {
        // Handle sign up
        const { error } = await authService.signUp(email, password);
        
        if (error) {
          setErrorMsg(error.message || 'Error creating account');
        } else {
          toast.success('Account created! Please check your email to verify your account or sign in.');
          setIsSignUp(false);
        }
      } else {
        // Handle sign in
        const { error } = await login(email, password);
        
        if (error) {
          setErrorMsg(error.message || 'Invalid login credentials');
        }
      }
    } catch (error) {
      setErrorMsg('An unexpected error occurred. Please try again.');
      console.error('Auth error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderForgotPasswordForm = () => (
    <>
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-biochar-500 text-white">
          <Leaf className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
        <CardDescription>
          {resetEmailSent 
            ? "Check your email for the password reset link" 
            : "Enter your email address and we'll send you a link to reset your password"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {errorMsg && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}
          {!resetEmailSent && (
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="youremail@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {!resetEmailSent ? (
            <Button type="submit" className="w-full bg-biochar-600 hover:bg-biochar-700" disabled={isSubmitting}>
              {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
              {isSubmitting ? 'Sending reset link...' : 'Send reset link'}
            </Button>
          ) : (
            <Button type="button" className="w-full bg-biochar-600 hover:bg-biochar-700" onClick={() => {
              setIsForgotPassword(false);
              setResetEmailSent(false);
            }}>
              Back to login
            </Button>
          )}
          <div className="text-center text-sm">
            <p>
              Remember your password?{' '}
              <button
                type="button"
                className="text-primary hover:underline"
                onClick={() => {
                  setIsForgotPassword(false);
                  setResetEmailSent(false);
                  setErrorMsg(null);
                }}
              >
                Sign in
              </button>
            </p>
          </div>
        </CardFooter>
      </form>
    </>
  );

  const renderLoginForm = () => (
    <>
      <CardHeader className="space-y-2 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-biochar-500 text-white">
          <Leaf className="h-6 w-6" />
        </div>
        <CardTitle className="text-2xl font-bold">Biochar Operations Hub</CardTitle>
        <CardDescription>
          {isSignUp 
            ? "Create a new account to get started" 
            : "Enter your credentials to sign in to your account"}
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          {errorMsg && (
            <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="youremail@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              {!isSignUp && (
                <button
                  type="button"
                  className="text-xs text-primary hover:underline"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsForgotPassword(true);
                    setErrorMsg(null);
                  }}
                >
                  Forgot password?
                </button>
              )}
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isSubmitting}
              required
            />
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <Button type="submit" className="w-full bg-biochar-600 hover:bg-biochar-700" disabled={isSubmitting}>
            {isSubmitting ? <Spinner size="sm" className="mr-2" /> : null}
            {isSubmitting ? (isSignUp ? 'Creating account...' : 'Signing in...') : (isSignUp ? 'Create account' : 'Sign in')}
          </Button>
          <div className="text-center text-sm">
            {isSignUp ? (
              <p>
                Already have an account?{' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setIsSignUp(false)}
                >
                  Sign in
                </button>
              </p>
            ) : (
              <p>
                Don't have an account?{' '}
                <button
                  type="button"
                  className="text-primary hover:underline"
                  onClick={() => setIsSignUp(true)}
                >
                  Create one
                </button>
              </p>
            )}
          </div>
        </CardFooter>
      </form>
    </>
  );

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-biochar-50 to-biochar-200 p-4">
      <Card className="w-full max-w-md shadow-lg">
        {isForgotPassword ? renderForgotPasswordForm() : renderLoginForm()}
      </Card>
    </div>
  );
};

export default Login;
