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
      <Main />
    </QueryClientProvider>
  );
};

export default App;
