import { SignIn } from "@clerk/nextjs";
import { AuthStage, authAppearance } from "@/components/auth/auth-stage";

export default function SignInPage() {
  return (
    <AuthStage eyebrow="Welcome back" title="Sit down at the keys.">
      <SignIn appearance={authAppearance} routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </AuthStage>
  );
}
