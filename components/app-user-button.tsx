"use client";

import { UserButton } from "@clerk/nextjs";
import { CreditCard, Palette } from "lucide-react";

type AppUserButtonProps = {
  appearance?: React.ComponentProps<typeof UserButton>["appearance"];
};

export function AppUserButton({ appearance }: AppUserButtonProps) {
  return (
    <UserButton appearance={appearance}>
      <UserButton.UserProfileLink
        label="Theme"
        url="/settings/theme"
        labelIcon={<Palette className="h-4 w-4" />}
      />
      <UserButton.UserProfileLink
        label="Billing"
        url="/settings/billing"
        labelIcon={<CreditCard className="h-4 w-4" />}
      />
    </UserButton>
  );
}
