"use client";

import { UserButton } from "@clerk/nextjs";
import { Palette } from "lucide-react";

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
    </UserButton>
  );
}
