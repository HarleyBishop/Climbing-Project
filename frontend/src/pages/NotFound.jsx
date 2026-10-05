import { useNavigate } from 'react-router-dom';
import { Btn } from '../components/ui/primitives';
import { BlurFade } from '../components/magicui/blur-fade';

function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center px-6 text-center">
      <BlurFade>
        <p className="text-8xl font-semibold tracking-tighter text-line">404</p>
        <h1 className="mt-4 text-4xl font-semibold">Lost the beta?</h1>
        <p className="mt-3 mb-8 text-lg text-muted">This route doesn't exist on the wall.</p>
        <Btn onClick={() => navigate('/')}>Back to your gyms</Btn>
      </BlurFade>
    </div>
  );
}

export default NotFound;
