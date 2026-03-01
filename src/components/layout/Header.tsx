import { Button } from "../ui/Button";

interface HeaderProps {
  activeTab: "recommend" | "arc";
  onTabChange: (tab: "recommend" | "arc") => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="px-6 md:px-16 pt-8 pb-0 flex items-end justify-between border-b border-brand-border relative flex-wrap gap-4 after:content-[''] after:absolute after:-bottom-[1px] after:left-0 after:w-[300px] after:h-[2px] after:bg-gradient-to-r after:from-brand-pink after:via-brand-indigo after:to-transparent">
      <div className="flex items-end gap-2">
        <div className="font-bebas text-5xl md:text-6xl tracking-[0.15em] leading-none bg-gradient-to-br from-white via-brand-pink to-brand-indigo bg-clip-text text-transparent pb-4">
          ANIMU
        </div>
        <div className="font-space text-[0.65rem] text-brand-muted tracking-[0.3em] uppercase pb-6 ml-2">
          Discover & Explore
        </div>
      </div>
      <nav className="flex gap-0 pb-0">
        <Button
          variant="nav-tab"
          active={activeTab === "recommend"}
          onClick={() => onTabChange("recommend")}
        >
          ◈ Recommendations
        </Button>
        <Button
          variant="nav-tab"
          active={activeTab === "arc"}
          onClick={() => onTabChange("arc")}
        >
          ◈ Arc Search
        </Button>
      </nav>
    </header>
  );
}
