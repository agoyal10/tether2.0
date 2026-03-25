import NavBar from "@/components/NavBar";
import { NaughtyModeProvider } from "@/components/NaughtyModeProvider";
import PushSetup from "@/components/PushSetup";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <NaughtyModeProvider>
    <div className="flex min-h-screen flex-col">
      <main className="mx-auto w-full max-w-md flex-1 px-4 pb-24 pt-6">
        {children}
      </main>
      <NavBar />
      <PushSetup />
    </div>
    </NaughtyModeProvider>
  );
}
