import { useState } from "react";
import { Header, type TabType } from "./components/layout/Header";
import { Toast } from "./components/ui/Toast";
import { ArcSearchTab } from "./features/arcSearch/ArcSearchTab";
import { RecommendationsTab } from "./features/recommendations/RecommendationsTab";
import { SentimentMapTab } from "./features/sentimentMap/SentimentMapTab";

function App() {
  const [activeTab, setActiveTab] = useState<TabType>("recommend");

  return (
    <div className="min-h-screen text-text flex flex-col pt-24 pb-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <main className="flex-1 mt-8 relative">
        {activeTab === "recommend" && <RecommendationsTab />}
        {activeTab === "arc" && <ArcSearchTab />}
        {activeTab === "sentiment" && <SentimentMapTab />}
      </main>

      <Toast />
    </div>
  );
}

export default App;
