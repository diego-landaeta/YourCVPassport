import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabase/client';
import { useAuth } from '../contexts/AuthContext';
import Modal from './Modal';

const GoogleIcon = () => (
    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M22.56,12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26,1.37-1.04,2.53-2.21,3.31v2.77h3.57c2.08-1.92,3.28-4.74,3.28-8.09Z" fill="#4285F4"/>
        <path d="M12,23c2.97,0,5.46-.98,7.28-2.66l-3.57-2.77c-.98.66-2.23,1.06-3.71,1.06-2.86,0-5.29-1.93-6.16-4.53H2.18v2.84C3.99,20.53,7.7,23,12,23Z" fill="#34A853"/>
        <path d="M5.84,14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43,8.55,1,10.22,1,12s.43,3.45,1.18,4.93l3.66-2.84Z" fill="#FBBC05"/>
        <path d="M12,5.38c1.62,0,3.06.56,4.21,1.64l3.15-3.15C17.45,2.09,14.97,1,12,1 7.7,1,3.99,3.47,2.18,7.07l3.66,2.84c.87-2.6,3.3-4.53,6.16-4.53Z" fill="#EA4335"/>
    </svg>
);

const LinkedInIcon = () => (
    <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#0077B5">
        <path d="M22.23 0H1.77C.8 0 0 .77 0 1.72v20.56C0 23.23.8 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.72V1.72C24 .77 23.2 0 22.23 0zM7.06 20.45h-3.5V8.97h3.5v11.48zM5.31 7.42c-1.14 0-2.07-.93-2.07-2.07s.93-2.07 2.07-2.07 2.07.93 2.07 2.07-.93 2.07-2.07 2.07zm13.38 13.03h-3.5v-5.58c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.44-2.14 2.94v5.68h-3.5V8.97h3.36v1.54h.05c.47-.88 1.62-1.81 3.31-1.81 3.55 0 4.2 2.34 4.2 5.38v6.37z" />
    </svg>
);

const AuthModal: React.FC = () => {
    const { isAuthModalOpen, closeModal, authMode, setAuthMode } = useAuth();
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [agreeToTerms, setAgreeToTerms] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const navigate = useNavigate();

    const isSignUp = authMode === 'signup';

    // Reset state when modal is closed or mode changes
    useEffect(() => {
        if (isAuthModalOpen) {
            setError(null);
            setSuccess(null);
            setFullName('');
            setEmail('');
            setPassword('');
            setConfirmPassword('');
            setAgreeToTerms(false);
        }
    }, [isAuthModalOpen, authMode]);

    const handleAuthAction = async (e?: React.FormEvent) => {
        e?.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isSignUp) {
                // Validate full name
                if (!fullName.trim()) {
                    setError('Full name is required');
                    setLoading(false);
                    return;
                }

                // Validate passwords match
                if (password !== confirmPassword) {
                    setError('Passwords do not match');
                    setLoading(false);
                    return;
                }

                // Validate password strength
                if (password.length < 8) {
                    setError('Password must be at least 8 characters long');
                    setLoading(false);
                    return;
                }

                // Validate terms acceptance
                if (!agreeToTerms) {
                    setError('You must accept the terms and conditions');
                    setLoading(false);
                    return;
                }

                const { error } = await supabase.auth.signUp({
                    email, password,
                    options: { data: { full_name: fullName } },
                });
                if (error) throw error;
                setSuccess('Sign-up successful! Please check your email to confirm your account.');
            } else {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                closeModal();
                navigate('/dashboard');
            }
        } catch (err: any) {
            setError(err.error_description || err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' });
            if (error) throw error;
        } catch (err: any) {
            setError(err.error_description || err.message);
            setLoading(false);
        }
    };

    const handleLinkedInLogin = async () => {
        setLoading(true);
        setError(null);
        try {
            const { error } = await supabase.auth.signInWithOAuth({ provider: 'linkedin_oidc' });
            if (error) throw error;
        } catch (err: any) {
            setError(err.error_description || err.message);
            setLoading(false);
        }
    };

    if (!isAuthModalOpen) return null;

    return (
        <Modal isOpen={isAuthModalOpen} onClose={closeModal} maxWidth="xl">
            <div className="w-full bg-white dark:bg-dark-bg-secondary rounded-lg max-h-[85vh] overflow-y-auto">
                {/* Header - Más compacto */}
                <div className="px-8 pt-5 pb-3 text-center border-b border-gray-100 dark:border-dark-border">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-1">
                        {isSignUp ? 'Create Your Account' : 'Welcome Back'}
                    </h2>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                        {isSignUp
                            ? 'Join thousands of professionals building their verified CV'
                            : 'Sign in to continue managing your professional CV'}
                    </p>
                </div>

                {/* Content - Espaciado reducido */}
                <div className="px-8 py-5">
                    {/* OAuth Buttons - Más compactos */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                        <button
                            onClick={handleGoogleLogin}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 py-2 px-3 border border-gray-300 dark:border-dark-border rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-dark-text-primary bg-white dark:bg-dark-bg-tertiary hover:bg-gray-50 dark:hover:bg-dark-bg-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <GoogleIcon />
                            <span className="hidden sm:inline">Continue with </span>
                            <span>Google</span>
                        </button>
                        <button
                            onClick={handleLinkedInLogin}
                            disabled={loading}
                            className="flex items-center justify-center gap-2 py-2 px-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#0077B5] hover:bg-[#006399] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <LinkedInIcon />
                            <span className="hidden sm:inline">Continue with </span>
                            <span>LinkedIn</span>
                        </button>
                    </div>

                    {/* Divider - Más compacto */}
                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-gray-200 dark:border-dark-border"></div>
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="px-2 bg-white dark:bg-dark-bg-secondary text-gray-500 dark:text-gray-400">
                                Or {isSignUp ? 'sign up' : 'sign in'} with email
                            </span>
                        </div>
                    </div>

                    {/* Form - Espaciado optimizado */}
                    <form onSubmit={handleAuthAction} className="space-y-3">
                        {/* Error/Success Messages */}
                        {error && (
                            <div className="p-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                                <p className="text-xs text-red-600 dark:text-red-400 text-center">{error}</p>
                            </div>
                        )}
                        {success && (
                            <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                                <p className="text-xs text-green-600 dark:text-green-400 text-center">{success}</p>
                            </div>
                        )}

                        {/* Full Name (Signup only) */}
                        {isSignUp && (
                            <div>
                                <label htmlFor="full-name" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Full Name
                                </label>
                                <input
                                    id="full-name"
                                    name="full-name"
                                    type="text"
                                    autoComplete="name"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    placeholder="John Doe"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cv-blue focus:border-transparent text-sm transition-all bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white"
                                />
                            </div>
                        )}

                        {/* Email */}
                        <div>
                            <label htmlFor="email" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Email Address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cv-blue focus:border-transparent text-sm transition-all bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete={isSignUp ? "new-password" : "current-password"}
                                required
                                minLength={isSignUp ? 8 : 6}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cv-blue focus:border-transparent text-sm transition-all bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white"
                            />
                        </div>

                        {/* Confirm Password (Signup only) */}
                        {isSignUp && (
                            <div>
                                <label htmlFor="confirmPassword" className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Confirm Password
                                </label>
                                <input
                                    id="confirmPassword"
                                    name="confirmPassword"
                                    type="password"
                                    autoComplete="new-password"
                                    required
                                    minLength={8}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-md shadow-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-cv-blue focus:border-transparent text-sm transition-all bg-white dark:bg-dark-bg-tertiary text-gray-900 dark:text-white"
                                />
                            </div>
                        )}

                        {/* Terms and Conditions (Signup only) */}
                        {isSignUp && (
                            <div className="flex items-start pt-1">
                                <input
                                    id="terms"
                                    type="checkbox"
                                    checked={agreeToTerms}
                                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                                    className="h-4 w-4 mt-0.5 text-cv-blue focus:ring-cv-blue border-gray-300 rounded flex-shrink-0"
                                />
                                <label htmlFor="terms" className="ml-2 text-xs text-gray-600 dark:text-gray-400 leading-tight">
                                    I agree to the{' '}
                                    <a href="/terms" target="_blank" className="text-cv-blue hover:text-cv-blue-dark underline">
                                        Terms and Conditions
                                    </a>
                                    {' and '}
                                    <a href="/privacy" target="_blank" className="text-cv-blue hover:text-cv-blue-dark underline">
                                        Privacy Policy
                                    </a>
                                </label>
                            </div>
                        )}

                        {/* Forgot Password (Login only) */}
                        {!isSignUp && (
                            <div className="flex justify-end pt-1">
                                <a href="/recovery" className="text-xs font-medium text-cv-blue hover:text-cv-blue-dark transition-colors">
                                    Forgot your password?
                                </a>
                            </div>
                        )}

                        {/* Submit Button */}
                        <div className="pt-2">
                            <button
                                type="submit"
                                disabled={loading || (isSignUp && !!success)}
                                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-cv-blue hover:bg-cv-blue-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-cv-blue transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? 'Processing...' : (isSignUp ? 'Create Account' : 'Log In')}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Footer */}
                <div className="px-8 py-3 bg-gray-50 dark:bg-dark-bg-tertiary border-t border-gray-100 dark:border-dark-border rounded-b-lg">
                    <p className="text-xs text-center text-gray-600 dark:text-gray-400">
                        {isSignUp ? 'Already have an account?' : "Don't have an account?"}
                        {' '}
                        <button
                            onClick={() => setAuthMode(isSignUp ? 'login' : 'signup')}
                            className="font-semibold text-cv-blue hover:text-cv-blue-dark transition-colors"
                        >
                            {isSignUp ? 'Log in' : 'Sign up'}
                        </button>
                    </p>
                </div>
            </div>
        </Modal>
    );
};

export default AuthModal;
