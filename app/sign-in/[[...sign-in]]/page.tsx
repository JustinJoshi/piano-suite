import { SignIn } from "@clerk/nextjs";
import { AuthStage } from "@/components/auth/auth-stage";

export default function SignInPage() {
  return (
    <AuthStage eyebrow="Welcome back" title="Sit down at the keys.">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </AuthStage>
  );
}
