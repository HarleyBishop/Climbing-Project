import { AuthScaffold } from '../components/ui/PageShell';
import LoginRegisterForm from '../components/LoginRegisterComponents/LoginRegisterForm';

function Login() {
  return (
    <AuthScaffold headline="Your next climb" headlineItalic="is waiting.">
      <LoginRegisterForm route="/api/token/" method="login" />
    </AuthScaffold>
  );
}

export default Login;
