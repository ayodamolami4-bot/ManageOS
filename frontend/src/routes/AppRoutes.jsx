import { Navigate, Route, Routes } from "react-router-dom";

import Home from "../pages/public/Home";
import DemoExplorer from "../pages/public/DemoExplorer";
import Product from "../pages/public/Product";
import HowItWorks from "../pages/public/HowItWorks";
import Security from "../pages/public/Security";
import About from "../pages/public/About";
import Contact from "../pages/public/Contact";
import Privacy from "../pages/public/Privacy";
import Terms from "../pages/public/Terms";

import Login from "../pages/auth/Login";
import Register from "../pages/auth/Register";
import ForgotPassword from "../pages/auth/ForgotPassword";
import ResetPassword from "../pages/auth/ResetPassword";
import Invite from "../pages/auth/Invite";

import ProtectedRoute from "./ProtectedRoute";
import AppLayout from "../layouts/AppLayout";
import Overview from "../pages/app/Overview";
import Goals from "../pages/app/Goals";
import Organization from "../pages/app/Organization";
import Work from "../pages/app/Work";
import Projects from "../pages/app/Projects";
import ProjectDetails from "../pages/app/ProjectDetails";
import Updates from "../pages/app/Updates";
import Discussions from "../pages/app/Discussions";
import Notifications from "../pages/app/Notifications";
import Activity from "../pages/app/Activity";
import Audit from "../pages/app/Audit";
import Files from "../pages/app/Files";
import People from "../pages/app/People";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/demo" element={<DemoExplorer />} />
      <Route path="/product" element={<Product />} />
      <Route path="/how-it-works" element={<HowItWorks />} />
      <Route path="/security" element={<Security />} />
      <Route path="/about" element={<About />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />

      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/invite" element={<Invite />} />

      <Route element={<ProtectedRoute />}>
        <Route path="/app" element={<AppLayout />}>
          <Route index element={<Navigate to="overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="goals" element={<Goals />} />
          <Route path="organization" element={<Organization />} />
          <Route path="work" element={<Work />} />
          <Route path="projects" element={<Projects />} />
          <Route path="projects/:projectId" element={<ProjectDetails />} />
          <Route path="updates" element={<Updates />} />
          <Route path="discussions" element={<Discussions />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="activity" element={<Activity />} />
          <Route path="audit" element={<Audit />} />
          <Route path="files" element={<Files />} />
          <Route path="people" element={<People />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
