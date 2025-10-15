import { ToastNotificationProvider } from "@canonical/react-components";
import { QueryClient, QueryClientProvider } from "react-query";

import "./App.scss";
import config from "./config";
import Main from "./pages/Main";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: config.api.FETCH_OPTIONS,
  },
});

const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastNotificationProvider>
        <Main />
      </ToastNotificationProvider>
    </QueryClientProvider>
  );
};

export default App;
