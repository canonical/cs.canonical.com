import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "@/components/MainLayout";
import FilterTableView from "@/components/Views/FilterTableView";
import Home from "@/pages/Home/Home";
import NewWebpage from "@/pages/NewWebpage";
import Owned from "@/pages/views/Owned";
import Requests from "@/pages/views/Requests";
import Reviewed from "@/pages/views/Reviewed";
import { useAuth } from "@/services/api/hooks/auth";
import { usePages } from "@/services/api/hooks/pages";
import { useUsers } from "@/services/api/hooks/users";
import { RoutesServices } from "@/services/routes";

const Main = (): React.ReactNode => {
  useAuth();
  useUsers();
  const { data } = usePages();

  function getDynamicRoutes() {
    if (!data?.length) return;
    return data.map(
      (project) => project?.templates && RoutesServices.generateRoutes(project.name, [project.templates]),
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/app">
          <Route element={<Home />} index />
          <Route element={<MainLayout />}>
            <Route element={<Owned />} path="views/owned" />
            <Route element={<Reviewed />} path="views/reviewed" />
            <Route element={<Requests />} path="views/requests" />
            <Route element={<FilterTableView />} path="views/table" />
            <Route element={<NewWebpage />} path="new-webpage" />
            {getDynamicRoutes()}
          </Route>
        </Route>
        <Route element={<Navigate to="/app" />} path="/" />
      </Routes>
    </BrowserRouter>
  );
};

export default Main;
