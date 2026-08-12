import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/public-site/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "@/components/ErrorBoundary";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Article from "@/public-site/pages/Article";
import { PublicationArchive, TagArchive, TopicArchive, YearArchive } from "@/public-site/pages/Archives";
import Author from "@/public-site/pages/Author";
import Home from "@/public-site/pages/Home";
import SitePage from "@/public-site/pages/SitePage";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/articles/:slug"} component={Article} />
      <Route path={"/authors/:authorId"} component={Author} />
      <Route path={"/topics/:slug"} component={TopicArchive} />
      <Route path={"/tags/:slug"} component={TagArchive} />
      <Route path={"/archive"} component={PublicationArchive} />
      <Route path={"/archive/:year"} component={YearArchive} />
      <Route path={"/404"} component={NotFound} />
      <Route path={"/:slug"} component={SitePage} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
