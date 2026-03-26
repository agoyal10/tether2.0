import NavBar from "@/components/NavBar";
import MainWrapper from "@/components/MainWrapper";
import { KeyboardProvider } from "@/components/KeyboardProvider";
import { NaughtyModeProvider } from "@/components/NaughtyModeProvider";
import PushSetup from "@/components/PushSetup";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <KeyboardProvider>
    <NaughtyModeProvider>
    <div className="flex min-h-screen flex-col">
      {/* Seamless status bar fade */}
      <div className="fixed top-0 left-0 right-0 z-50 h-16 bg-gradient-to-b from-lavender-light via-lavender-light/80 to-transparent dark:from-gray-950 dark:via-gray-950/80 pointer-events-none" />
      <MainWrapper>
        {children}
      </MainWrapper>
      <NavBar />
      <PushSetup />
    </div>
    </NaughtyModeProvider>
    </KeyboardProvider>
  );
}
