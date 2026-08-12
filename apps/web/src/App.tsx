import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/public-site/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LoginPage } from "./auth/LoginPage";
import Article from "@/public-site/pages/Article";
import { PublicationArchive, TagArchive, TopicArchive, YearArchive } from "@/public-site/pages/Archives";
import Author from "@/public-site/pages/Author";
import Home from "@/public-site/pages/Home";
import { StudioAnalytics, StudioAudit, StudioCapabilities, StudioExport, StudioMedia, StudioModeration, StudioNotifications, StudioOverview, StudioPosts, StudioSettings, StudioTaxonomy, StudioTeam } from "@/admin-site/pages/Studio";
import { StudioAIProviders } from "@/admin-site/pages/StudioAI";
import { StudioEditor } from "@/admin-site/pages/StudioEditor";
import StudioPreview from "@/admin-site/pages/StudioPreview";
import SitePage from "@/public-site/pages/SitePage";
import { StudioBranding, StudioPages } from "@/admin-site/pages/SiteManagement";
import AgentWorkspace from "@/admin-site/pages/AgentWorkspace";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/articles/:slug"} component={Article} />
      <Route path={"/authors/:authorId"} component={Author} />
      <Route path={"/topics/:slug"} component={TopicArchive} />
      <Route path={"/tags/:slug"} component={TagArchive} />
      <Route path={"/archive"} component={PublicationArchive} />
      <Route path={"/archive/:year"} component={YearArchive} />
      <Route path={"/studio"} component={StudioOverview} />
      <Route path={"/studio/posts"} component={StudioPosts} />
      <Route path={"/studio/posts/new"} component={StudioEditor} />
      <Route path={"/studio/preview/:id"} component={StudioPreview} />
      <Route path={"/studio/posts/:id"} component={StudioEditor} />
      <Route path={"/studio/media"} component={StudioMedia} />
      <Route path={"/studio/taxonomy"} component={StudioTaxonomy} />
      <Route path={"/studio/moderation"} component={StudioModeration} />
      <Route path={"/studio/analytics"} component={StudioAnalytics} />
      <Route path={"/studio/team"} component={StudioTeam} />
      <Route path={"/studio/notifications"} component={StudioNotifications} />
      <Route path={"/studio/ai"} component={StudioAIProviders} />
      <Route path={"/studio/agent"} component={AgentWorkspace} />
      <Route path={"/studio/settings"} component={StudioSettings} />
      <Route path={"/studio/brand"} component={StudioBranding} />
      <Route path={"/studio/pages"} component={StudioPages} />
      <Route path={"/studio/capabilities"} component={StudioCapabilities} />
      <Route path={"/studio/audit"} component={StudioAudit} />
      <Route path={"/studio/export"} component={StudioExport} />
      <Route path={"/login"} component={LoginPage} />
      <Route path={"/404"} component={NotFound} />
      <Route path={"/:slug"} component={SitePage} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
