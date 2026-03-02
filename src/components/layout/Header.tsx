import { Button } from "../ui/Button";

export type TabType = "recommend" | "arc" | "sentiment";

interface HeaderProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function Header({ activeTab, onTabChange }: HeaderProps) {
  return (
    <header className="px-6 md:px-16 pt-8 pb-0 flex flex-col items-center justify-center border-b border-brand-border relative gap-6 after:content-[''] after:absolute after:-bottom-[1px] after:left-1/2 after:-translate-x-1/2 after:w-[300px] after:h-[2px] after:bg-gradient-to-r after:from-transparent after:via-brand-pink after:to-transparent">
      <div className="flex flex-col items-center gap-1">
        <img src="/logo.png" alt="ANIMU Logo" className="h-[5rem] md:h-[8rem] object-contain" />
        <div className="font-space text-[0.65rem] text-brand-muted tracking-[0.3em] uppercase">
          Discover & Explore
        </div>
      </div>
      <nav className="flex gap-0 pb-0 hidden lg:flex">
        <Button
          variant="nav-tab"
          active={activeTab === "recommend"}
          onClick={() => onTabChange("recommend")}
        >
          ◈ Recommendations
        </Button>
        <Button
          variant="nav-tab"
          active={activeTab === "sentiment"}
          onClick={() => onTabChange("sentiment")}
        >
          ◈ Sentiment Map
        </Button>
        <Button
          variant="nav-tab"
          active={activeTab === "arc"}
          onClick={() => onTabChange("arc")}
        >
          ◈ Arc Search
        </Button>
      </nav>
      <nav className="flex flex-wrap items-center gap-1 lg:hidden mt-4 bg-brand-surface2/50 p-1 rounded-lg w-full">
        <Button
          variant="nav-tab"
          active={activeTab === "recommend"}
          onClick={() => onTabChange("recommend")}
          className="flex-1 px-2 py-3 min-w-[140px] text-center justify-center"
        >
          Recommendations
        </Button>
        <Button
          variant="nav-tab"
          active={activeTab === "sentiment"}
          onClick={() => onTabChange("sentiment")}
          className="flex-1 px-2 py-3 min-w-[140px] text-center justify-center"
        >
          Sentiment Map
        </Button>
        <Button
          variant="nav-tab"
          active={activeTab === "arc"}
          onClick={() => onTabChange("arc")}
          className="flex-1 px-2 py-3 min-w-[140px] text-center justify-center"
        >
          Arc Search
        </Button>
      </nav>
    </header>
  );
}
