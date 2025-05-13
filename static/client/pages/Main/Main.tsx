import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import MainLayout from "@/components/MainLayout";
import Owned from "@/pages/views/Owned";
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
      (project) =>
        project?.data?.templates && RoutesServices.generateRoutes(project.data.name, [project.data.templates]),
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />} path="/app">
          <Route element={<Owned />} path="views/owned" />
          <Route element={<Reviewed />} path="views/reviewed" />
          {getDynamicRoutes()}
        </Route>
        <Route element={<Navigate to="/app" />} path="/" />
      </Routes>
    </BrowserRouter>
  );
};

export default Main;
