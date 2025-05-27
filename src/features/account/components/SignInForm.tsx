import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { AuthService } from '../../services/AuthService';

const SignInForm: React.FC = () => {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async (data: SignInFormData) => {
    setError('');
    setLoading(true);
    try {
      await AuthService.signIn(data.email, data.password);
      router.push('/dashboard');
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Render your form here */}
    </div>
  );
};

export default SignInForm; 