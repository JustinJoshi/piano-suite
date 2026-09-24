import { SignUp } from "@clerk/nextjs";
import { AuthStage, authAppearance } from "@/components/auth/auth-stage";

export default function SignUpPage() {
  return (
    <AuthStage eyebrow="Free forever" title="Save your practice pages.">
      <SignUp appearance={authAppearance} routing="path" path="/sign-up" signInUrl="/sign-in" />
    </AuthStage>
  );
}
