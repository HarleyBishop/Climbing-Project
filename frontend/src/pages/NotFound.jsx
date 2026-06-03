import { useNavigate } from 'react-router-dom';
import { useTheme } from '../theme';
import { Sky } from '../components/ui/Sky';
import { Btn } from '../components/ui/primitives';

function NotFound() {
  const P = useTheme();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen relative bg-sheet flex flex-col items-center justify-center">
      <Sky stars={P.key === 'dusk'} />
      <div className="relative text-center px-[30px]">
        <p className="font-serif italic text-[64px] m-0 text-sky-text opacity-90 leading-none">404</p>
        <h1 className="font-display font-normal text-[30px] mt-3 mb-0 text-sky-text">Lost the beta?</h1>
        <p className="font-serif italic text-base text-sky-text opacity-85 mt-2 mb-6">
          This route doesn't exist on the wall.
        </p>
        <Btn onClick={() => navigate('/')}>Back to your gyms</Btn>
      </div>
    </div>
  );
}

export default NotFound;
