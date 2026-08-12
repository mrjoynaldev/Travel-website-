import { Route, Switch } from "wouter";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import LoginPage from "./auth/LoginPage";
import { StudioOverview, StudioPosts, StudioMedia, StudioTaxonomy, StudioModeration, StudioAnalytics, StudioTeam, StudioNotifications, StudioSettings, StudioAudit, StudioCapabilities, StudioExport } from "@/admin-site/pages/Studio";
import { StudioAIProviders } from "@/admin-site/pages/StudioAI";
import { StudioEditor } from "@/admin-site/pages/StudioEditor";
import StudioPreview from "@/admin-site/pages/StudioPreview";
import { StudioBranding, StudioPages } from "@/admin-site/pages/SiteManagement";
import { StudioApiTokens, StudioSubscribers } from "@/admin-site/pages/StudioDeveloper";
import AgentWorkspace from "@/admin-site/pages/AgentWorkspace";
import StudioSections from "@/admin-site/pages/SiteSections";

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Switch>
            <Route path={"/login"} component={LoginPage} />
            <Route path={"/studio"} component={StudioOverview} />
            <Route path={"/studio/posts"} component={StudioPosts} />
            <Route path={"/studio/posts/new"} component={StudioEditor} />
            <Route path={"/studio/posts/:id"} component={StudioEditor} />
            <Route path={"/studio/preview/:id"} component={StudioPreview} />
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
            <Route path={"/studio/sections"} component={StudioSections} />
            <Route path={"/studio/capabilities"} component={StudioCapabilities} />
            <Route path={"/studio/audit"} component={StudioAudit} />
            <Route path={"/studio/export"} component={StudioExport} />
            <Route path={"/studio/subscribers"} component={StudioSubscribers} />
            <Route path={"/studio/api-tokens"} component={StudioApiTokens} />
            <Route path={"/"} component={StudioOverview} />
            <Route component={StudioOverview} />
          </Switch>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
