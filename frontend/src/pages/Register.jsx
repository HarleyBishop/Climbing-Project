import { AuthScaffold } from '../components/ui/PageShell';
import LoginRegisterForm from '../components/LoginRegisterComponents/LoginRegisterForm';

function Register() {
  return (
    <AuthScaffold headline="Start your" headlineItalic="climbing story.">
      <LoginRegisterForm route="/api/user/register/" method="register" />
    </AuthScaffold>
  );
}

export default Register;
