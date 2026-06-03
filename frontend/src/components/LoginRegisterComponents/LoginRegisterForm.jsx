import { useState } from 'react';
import api from '../../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../constants';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
import { useTheme } from '../../theme';
import { Btn, Field, Eyebrow } from '../ui/primitives';

function GoogleWord() {
  return (
    <span style={{ fontWeight: 800, fontSize: 14 }}>
      <span style={{ color: '#4285F4' }}>G</span>
      <span style={{ color: '#EA4335' }}>o</span>
      <span style={{ color: '#FBBC05' }}>o</span>
      <span style={{ color: '#4285F4' }}>g</span>
      <span style={{ color: '#34A853' }}>l</span>
      <span style={{ color: '#EA4335' }}>e</span>
    </span>
  );
}

function LoginRegisterForm({ route, method }) {
  const P = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isSetterRole, setIsSetterRole] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from?.pathname || '/';

  const name = method === 'login' ? 'Login' : 'Register';
  const isRegister = method === 'register';

  const handleOAuthSuccess = (tokens) => {
    localStorage.setItem(ACCESS_TOKEN, tokens.access);
    localStorage.setItem(REFRESH_TOKEN, tokens.refresh);
    navigate(redirectTo, { replace: true });
  };

  const handleOAuthError = (err) => {
    if (err?.response?.status === 403) {
      toast.error('Setter accounts cannot use OAuth. Please log in with username and password.');
    } else {
      toast.error('OAuth sign-in failed. Please try again.');
    }
  };

  // useGoogleLogin (implicit flow) forwards the Google access_token to our
  // backend which verifies it server-side and issues our own JWT pair.
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      try {
        const res = await api.post('/api/auth/google/', { access_token: tokenResponse.access_token });
        handleOAuthSuccess(res.data);
      } catch (err) {
        handleOAuthError(err);
      }
    },
    onError: () => { toast.error('Google sign-in failed. Please try again.'); },
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { username, password };
      if (isRegister) payload.is_verified_setter = isSetterRole;
      const res = await api.post(route, payload);
      if (method === 'login') {
        localStorage.setItem(ACCESS_TOKEN, res.data.access);
        localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
        navigate(redirectTo, { replace: true });
      } else {
        navigate('/login');
      }
    } catch (error) {
      const data = error?.response?.data;
      const msg = data?.username?.[0] || data?.password?.[0] || data?.detail || 'Something went wrong. Please try again.';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <Field label="Username" value={username} onChange={setUsername} placeholder="your handle" style={{ marginBottom: 0 }} />
        <Field label="Password" value={password} onChange={setPassword} placeholder="your password" type="password" style={{ marginBottom: 0 }} />

        {isRegister && (
          <div>
            <Eyebrow style={{ marginBottom: 8, fontSize: 10 }}>I'm registering as a…</Eyebrow>
            <div style={{ display: 'flex', gap: 10 }}>
              {[['climber', 'Climber'], ['setter', 'Setter / Gym owner']].map(([k, lab]) => {
                const sel = isSetterRole ? k === 'setter' : k === 'climber';
                return (
                  <button key={k} type="button" onClick={() => setIsSetterRole(k === 'setter')}
                    style={{ flex: 1, fontFamily: P.body, fontWeight: 600, fontSize: 13, padding: '10px 8px', borderRadius: 11, cursor: 'pointer', border: `1px solid ${sel ? P.primary : P.line}`, background: sel ? P.primary : P.card, color: sel ? '#fff' : P.ink, transition: 'all .12s' }}>
                    {lab}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        <Btn full type="submit" disabled={loading} style={{ marginTop: 3 }}>
          {loading ? '…' : name}
        </Btn>
      </div>

      <p style={{ textAlign: 'center', margin: '14px 0 0', fontFamily: P.body, fontSize: 13, color: P.ink2 }}>
        {isRegister
          ? <>Already have an account?{' '}<span onClick={() => navigate('/login')} style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 15, color: P.primary, cursor: 'pointer' }}>Login</span></>
          : <>Don't have an account?{' '}<span onClick={() => navigate('/register')} style={{ fontFamily: P.serif, fontStyle: 'italic', fontSize: 15, color: P.primary, cursor: 'pointer' }}>Register</span></>
        }
      </p>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '18px 0' }}>
        <span style={{ flex: 1, height: 1, background: P.line }} />
        <span style={{ fontFamily: P.body, fontSize: 11.5, color: P.ink3 }}>or continue with</span>
        <span style={{ flex: 1, height: 1, background: P.line }} />
      </div>

      <Btn full variant="ghost" type="button" onClick={() => googleLogin()}>
        <GoogleWord />
      </Btn>

      {isRegister && (
        <p style={{ textAlign: 'center', margin: '12px 0 0', fontFamily: P.serif, fontStyle: 'italic', fontSize: 12.5, color: P.ink3, lineHeight: 1.5 }}>
          Google sign-in always creates a Climber account. Setters register above.
        </p>
      )}
    </form>
  );
}

export default LoginRegisterForm;
