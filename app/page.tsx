import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Sheet, SheetTrigger, SheetContent } from "../components/ui/sheet";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "../components/ui/collapsible";
export default function Home() {
  return (
    <div className="min-h-screen w-full font-sans bg-gradient-to-br from-[#800020] via-[#6a0572] to-[#a4508b] flex items-center justify-center relative">
      {/* Slide-in Sidebar Navigation */}
      <Sheet>
        {/* Fixed, top-left, always visible burger button for best UX */}
        <SheetTrigger asChild>
          <Button
            aria-label="Open menu"
            variant="outline"
            className="fixed top-6 left-6 z-50 w-14 h-14 rounded-full bg-white/90 text-[#800020] border-none shadow-xl hover:bg-white/80 focus:ring-4 focus:ring-[#a4508b]/40 transition-all flex items-center justify-center text-3xl md:w-16 md:h-16"
            style={{ boxShadow: '0 4px 24px 0 rgba(128,0,32,0.15)' }}
          >
            <span className="sr-only">Open menu</span>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#800020" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8"><line x1="4" y1="6" x2="20" y2="6"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="18" x2="20" y2="18"/></svg>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-72 bg-gradient-to-b from-[#800020] via-[#6a0572] to-[#a4508b] text-white border-none pt-12">
          <nav className="flex flex-col gap-2 mt-8">
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="justify-start w-full text-lg text-white hover:bg-white/10">Forms ▼</Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col pl-4 gap-1">
                  <Link href="/forms/onboarding">
                    <Button variant="ghost" className="justify-start w-full text-white hover:bg-[#a4508b]/30">Onboarding Checklist</Button>
                  </Link>
                  <Link href="/forms/clearance">
                    <Button variant="ghost" className="justify-start w-full text-white hover:bg-[#a4508b]/30">Clearance Checklist</Button>
                  </Link>
                </div>
              </CollapsibleContent>
            </Collapsible>
            <Collapsible>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="justify-start w-full text-lg text-white hover:bg-white/10">Directory ▼</Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="flex flex-col pl-4 gap-1">
                  <Link href="/directory/pag-ibig">
                    <Button variant="ghost" className="justify-start w-full text-white hover:bg-[#a4508b]/30">Pag-IBIG</Button>
                  </Link>
                  <Link href="/directory/philhealth">
                    <Button variant="ghost" className="justify-start w-full text-white hover:bg-[#a4508b]/30">PhilHealth</Button>
                  </Link>
                  <Link href="/directory/sss">
                    <Button variant="ghost" className="justify-start w-full text-white hover:bg-[#a4508b]/30">SSS</Button>
                  </Link>
                  <Link href="/directory/tin">
                    <Button variant="ghost" className="justify-start w-full text-white hover:bg-[#a4508b]/30">TIN</Button>
                  </Link>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </nav>
        </SheetContent>
      </Sheet>
      <main className="flex min-h-[80vh] w-full max-w-3xl flex-col items-center justify-center py-20 px-10 bg-white/90 rounded-3xl shadow-2xl border border-white/30">
        <Image
          className="dark:invert mb-8"
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <h1 className="text-4xl font-extrabold text-[#800020] mb-4 text-center drop-shadow-lg">Welcome to ABIC Accounting</h1>
        <p className="max-w-xl text-lg leading-8 text-[#6a0572] text-center mb-8 font-medium">
          Get started by exploring the forms and directory using the menu. Enjoy a modern, vibrant interface with a maroon-purple gradient and clean white accents.
        </p>
        <div className="flex flex-col gap-4 text-base font-medium sm:flex-row w-full justify-center">
          <a
            className="flex h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#800020] to-[#a4508b] px-6 text-white shadow-md hover:from-[#a4508b] hover:to-[#800020] transition-colors md:w-[180px]"
            href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Image
              className="dark:invert"
              src="/vercel.svg"
              alt="Vercel logomark"
              width={16}
              height={16}
            />
            Deploy Now
          </a>
          <a
            className="flex h-12 items-center justify-center rounded-full border border-[#a4508b] px-6 text-[#800020] bg-white hover:bg-[#a4508b]/10 transition-colors md:w-[180px] shadow-md"
            href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template-tw&utm_campaign=create-next-app"
            target="_blank"
            rel="noopener noreferrer"
          >
            Documentation
          </a>
        </div>
      </main>
    </div>
  );
}

