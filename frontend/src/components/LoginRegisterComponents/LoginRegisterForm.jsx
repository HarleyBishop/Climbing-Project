import { useState } from 'react';
import api from '../../api';
import { useNavigate, useLocation } from 'react-router-dom';
import { ACCESS_TOKEN, REFRESH_TOKEN } from '../../constants';
import { useGoogleLogin } from '@react-oauth/google';
import toast from 'react-hot-toast';
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
      <div className="flex flex-col gap-3">
        <Field label="Username" value={username} onChange={setUsername} placeholder="your handle" style={{ marginBottom: 0 }} />
        <Field label="Password" value={password} onChange={setPassword} placeholder="your password" type="password" style={{ marginBottom: 0 }} />

        {isRegister && (
          <div>
            <Eyebrow style={{ marginBottom: 8, fontSize: 10 }}>I'm registering as a…</Eyebrow>
            <div className="flex gap-[10px]">
              {[['climber', 'Climber'], ['setter', 'Setter / Gym owner']].map(([k, lab]) => {
                const sel = isSetterRole ? k === 'setter' : k === 'climber';
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setIsSetterRole(k === 'setter')}
                    className={`flex-1 font-body font-semibold text-[13px] px-2 py-[10px] rounded-[11px] cursor-pointer border transition-all duration-[120ms] ${
                      sel ? 'border-primary bg-primary text-white' : 'border-line bg-card text-ink'
                    }`}
                  >
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

      <p className="text-center mt-[14px] mb-0 font-body text-[13px] text-ink2">
        {isRegister
          ? <>Already have an account?{' '}<span onClick={() => navigate('/login')} className="font-serif italic text-[15px] text-primary cursor-pointer">Login</span></>
          : <>Don't have an account?{' '}<span onClick={() => navigate('/register')} className="font-serif italic text-[15px] text-primary cursor-pointer">Register</span></>
        }
      </p>

      <div className="flex items-center gap-3 my-[18px]">
        <span className="flex-1 h-px bg-line" />
        <span className="font-body text-[11.5px] text-ink3">or continue with</span>
        <span className="flex-1 h-px bg-line" />
      </div>

      <Btn full variant="ghost" type="button" onClick={() => googleLogin()}>
        <GoogleWord />
      </Btn>

      {isRegister && (
        <p className="text-center mt-3 mb-0 font-serif italic text-[12.5px] text-ink3 leading-[1.5]">
          Google sign-in always creates a Climber account. Setters register above.
        </p>
      )}
    </form>
  );
}

export default LoginRegisterForm;
