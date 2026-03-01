import { useState } from "react";
import { Header } from "./components/layout/Header";
import { Toast } from "./components/ui/Toast";
import { ArcSearchTab } from "./features/arcSearch/ArcSearchTab";
import { RecommendationsTab } from "./features/recommendations/RecommendationsTab";

function App() {
  const [activeTab, setActiveTab] = useState<"recommend" | "arc">("recommend");

  return (
    <>
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="px-6 md:px-16 py-8 max-w-[1600px] mx-auto">
        {activeTab === "recommend" && <RecommendationsTab />}
        {activeTab === "arc" && <ArcSearchTab />}
      </main>

      <Toast />
    </>
  );
}

export default App;
