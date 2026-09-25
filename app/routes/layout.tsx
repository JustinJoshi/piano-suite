import { RollFrame } from "@/components/roll/roll-frame";

export default function RoutesLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <RollFrame>{children}</RollFrame>;
}
