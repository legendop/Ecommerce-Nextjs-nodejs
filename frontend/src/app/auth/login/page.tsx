'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { PhoneIcon, KeyIcon } from '@heroicons/react/24/outline';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { useSettingsStore } from '@/stores/settingsStore';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnUrl = searchParams.get('returnUrl') || '/';

  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { setUser } = useAuthStore();
  const { config: siteConfig, initialize } = useSettingsStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await authApi.sendOtp(phone);
      toast.success('OTP sent to your phone');
      setStep('otp');
    } catch {
      toast.error('Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await authApi.verifyOtp(phone, otp);
      const user = response.data.data.user;
      setUser(user);
      toast.success('Login successful!');
      router.push(returnUrl);
    } catch {
      toast.error('Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-brand-pink-light px-4 py-12">
      <div className="max-w-md w-full">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="text-3xl font-bold text-brand-purple">
            {(siteConfig?.name || 'ShriToys').split(' ').slice(0, -1).join(' ')}
            <span className="text-brand-pink">
              {(siteConfig?.name || 'ShriToys').split(' ').slice(-1)}
            </span>
          </Link>
          <h2 className="mt-4 text-xl font-semibold text-brand-purple">
            {step === 'phone' ? 'Welcome Back!' : 'Verify Your Number'}
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            {step === 'phone'
              ? 'Enter your phone number to continue'
              : `OTP sent to +91 ${phone}`}
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-lg p-8">
          {step === 'phone' ? (
            <form onSubmit={handleSendOtp} className="space-y-5">
              <Input
                label="Phone Number"
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                pattern="[0-9]{10}"
                maxLength={10}
                leadingIcon={<PhoneIcon className="h-4 w-4" />}
              />
              <Button type="submit" variant="pink" fullWidth isLoading={isLoading} size="lg">
                Send OTP
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="space-y-5">
              <Input
                label="Enter OTP"
                type="text"
                placeholder="6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                pattern="[0-9]{6}"
                maxLength={6}
                leadingIcon={<KeyIcon className="h-4 w-4" />}
              />
              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => setStep('phone')}
                  className="text-brand-pink hover:underline font-medium"
                >
                  Change number
                </button>
                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={isLoading}
                  className="text-brand-pink hover:underline font-medium disabled:opacity-50"
                >
                  Resend OTP
                </button>
              </div>
              <Button type="submit" variant="pink" fullWidth isLoading={isLoading} size="lg">
                Verify & Login
              </Button>
            </form>
          )}

          <div className="mt-6 text-center">
            <Link href="/" className="text-sm text-gray-400 hover:text-brand-purple transition-colors">
              ← Back to home
            </Link>
          </div>
        </div>

        <p className="mt-5 text-center text-xs text-gray-400">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
}
