import NavBar from "@/components/NavBar";
import ThemeToggle from "@/components/ThemeToggle";
import { NaughtyModeProvider } from "@/components/NaughtyModeProvider";
import PushSetup from "@/components/PushSetup";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NaughtyModeProvider>
    <div className="flex min-h-screen flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-40 flex justify-end px-4 pt-4">
        <ThemeToggle />
      </div>
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-2">
        {children}
      </main>
      <NavBar />
      <PushSetup />
    </div>
    </NaughtyModeProvider>
  );
}
