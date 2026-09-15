import { SignUp } from "@clerk/nextjs";
import { AuthStage } from "@/components/auth/auth-stage";

export default function SignUpPage() {
  return (
    <AuthStage eyebrow="Free forever" title="Save your practice pages.">
      <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
    </AuthStage>
  );
}
