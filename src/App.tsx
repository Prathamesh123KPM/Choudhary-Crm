import React, { useState, useEffect, useRef } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate,
  useLocation,
  Outlet,
  useOutletContext,
  useSearchParams
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { localStore, fetchLeads } from './services/crmService';
import { getEmployeePerformanceMetrics } from './utils/crmMetrics';
import { Lead } from './types/crm';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import SharedInbox from './components/SharedInbox';
import LeadTable from './components/LeadTable';
import FollowupModule from './components/FollowupModule';
import SiteVisitModule from './components/SiteVisitModule';
import BookingModule from './components/BookingModule';
import ProjectsModule from './components/ProjectsModule';
import EmployeesModule from './components/EmployeesModule';
import ReportsModule from './components/ReportsModule';
import MetaIntegrationModule from './components/MetaIntegrationModule';
import AuditLogModule from './components/AuditLogModule';
import AddLeadModal from './components/AddLeadModal';
import Footer from './components/Footer';
import LoginPage from './components/LoginPage';
import ChangePasswordScreen from './components/ChangePasswordScreen';
import ImpersonationBanner from './components/ImpersonationBanner';
import { TodaysWorkModule } from './components/TodaysWorkModule';
import { RoleGuard } from './components/RoleGuard';
import { LeadDetailRoute } from './components/LeadDetailRoute';

const TAB_PAGE_NAMES: Record<string, string> = {
  dashboard: 'Dashboard',
  work: "Today's Work",
  inbox: 'New Leads Inbox',
  leads: 'Leads',
  followups: 'Follow-ups',
  visits: 'Site Visits',
  bookings: 'Bookings',
  projects: 'Projects',
  team: 'Sales Team',
  employees: 'Sales Team',
  reports: 'Analytics & Reports',
  meta: 'Meta Lead Integration',
  audit: 'Audit Logs'
};

const AppLayout: React.FC = () => {
  const { isAuthenticated, isOwner, isTeamLeader, isEmployee, currentUser, mustChangePassword } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [showAddLeadModal, setShowAddLeadModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [, setTick] = useState(0);

  // Track previous authenticated user UID to detect user switches
  const prevUserUidRef = useRef<string | null>(currentUser?.uid || null);

  useEffect(() => {
    if (isAuthenticated && currentUser?.uid) {
      fetchLeads(currentUser.uid).catch(err => console.warn('Leads fetch error:', err));
      if (prevUserUidRef.current && prevUserUidRef.current !== currentUser.uid) {
        // User account switched (impersonating, stopping impersonation, or switching user)
        // Reset to dashboard on switch so previous user's last screen is not kept
        navigate('/dashboard', { replace: true });
      }
      prevUserUidRef.current = currentUser.uid;
    } else {
      prevUserUidRef.current = null;
    }
  }, [isAuthenticated, currentUser?.uid, navigate]);

  useEffect(() => {
    const unsub = localStore.subscribe(() => {
      setTick(t => t + 1);
    });
    return unsub;
  }, []);

  // Guarantee that the outer window scroll position stays locked to 0,0
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' as ScrollBehavior });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  }, [location.pathname]);

  // Determine current active tab from pathname
  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentTab = pathParts[0] || 'dashboard';

  const handleSelectTab = (tab: string) => {
    if (tab === 'team' || tab === 'employees') {
      navigate('/team');
    } else if (tab === 'work' || tab === 'todays-work') {
      navigate('/work');
    } else {
      navigate(`/${tab}`);
    }
  };

  const handleGlobalBack = () => {
    if (pathParts.length > 1) {
      navigate(`/${pathParts[0]}`);
    } else if (location.key !== 'default') {
      navigate(-1);
    } else {
      navigate('/dashboard');
    }
  };

  const canGoBack = Boolean(location.pathname !== '/dashboard' || pathParts.length > 1);

  // Show login screen if user is not authenticated
  if (!isAuthenticated) {
    return <LoginPage />;
  }

  // Force password change on first login or when required by security policy (bypassed for Kishan / owner)
  if (mustChangePassword && !isOwner && currentUser?.username !== 'kishan' && currentUser?.uid !== 'admin-001') {
    return <ChangePasswordScreen />;
  }

  const userMetrics = getEmployeePerformanceMetrics(isOwner ? 'ALL' : currentUser.uid);
  const unassignedCount = localStore.leads.filter(l => !l.assignedEmployeeId).length;
  const todayFollowupsCount = userMetrics.dueTodayFollowupsCount;
  const todayWorkCount = userMetrics.totalActionItemsToday;

  return (
    <div className="relative h-screen bg-slate-50 dark:bg-[#0c0d12] text-neutral-900 dark:text-neutral-100 flex flex-col font-sans antialiased selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black transition-colors duration-200 w-full max-w-full overflow-hidden">
      {/* Apple iOS Fluid Ambient Gradient Mesh (gives glass materials vibrant light to refract) */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden z-0 opacity-60 dark:opacity-40" aria-hidden="true">
        <div className="absolute -top-[20%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-gradient-to-br from-blue-400/25 via-indigo-300/15 to-transparent blur-3xl transform-gpu" />
        <div className="absolute top-[30%] -right-[15%] w-[55vw] h-[55vw] rounded-full bg-gradient-to-bl from-purple-400/20 via-pink-300/10 to-transparent blur-3xl transform-gpu" />
        <div className="absolute -bottom-[20%] left-[20%] w-[45vw] h-[45vw] rounded-full bg-gradient-to-tr from-sky-300/20 via-cyan-200/15 to-transparent blur-3xl transform-gpu" />
      </div>

      {/* High-visibility Viewing as X Impersonation Banner */}
      <ImpersonationBanner />

      {/* Header Bar with Global Back Button & Deep Route Awareness */}
      <Header
        activeTab={currentTab}
        onSelectTab={handleSelectTab}
        onOpenNewLeadModal={() => setShowAddLeadModal(true)}
        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
        isMobileMenuOpen={isMobileMenuOpen}
        canGoBack={canGoBack}
        onGoBack={handleGlobalBack}
        previousPageName={TAB_PAGE_NAMES[currentTab] || 'Previous Page'}
      />

      <div className="relative z-10 flex flex-1 w-full min-w-0 overflow-hidden">
        {/* Sidebar Navigation (with Mobile Drawer Support) */}
        <Sidebar
          activeTab={currentTab}
          onSelectTab={handleSelectTab}
          unassignedCount={unassignedCount}
          todayFollowupsCount={todayFollowupsCount}
          todayWorkCount={todayWorkCount}
          isOpenMobile={isMobileMenuOpen}
          onCloseMobile={() => setIsMobileMenuOpen(false)}
        />

        {/* Scrollable Viewport: only leads & page content scroll */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden">
          {/* Main Viewport */}
          <main className="flex-1 p-3 sm:p-5 w-full min-w-0 space-y-5">
            {/* Router Outlet for Page Modules */}
            <Outlet context={{ onOpenNewLeadModal: () => setShowAddLeadModal(true) }} />
          </main>

          {/* Brand Footer */}
          <Footer onSelectTab={handleSelectTab} />
        </div>
      </div>

      {/* Global Add Lead Modal */}
      {showAddLeadModal && (
        <AddLeadModal onClose={() => setShowAddLeadModal(false)} />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Navigate to="/dashboard" replace />} />

              {/* 1. Dashboard Route */}
              <Route
                path="dashboard"
                element={
                  <DashboardWrapper />
                }
              />

              {/* 2. Today's Work Route */}
              <Route
                path="work"
                element={
                  <TodaysWorkWrapper />
                }
              />
              <Route path="todays-work" element={<Navigate to="/work" replace />} />

              {/* 3. New Leads Inbox Route */}
              <Route
                path="inbox"
                element={
                  <InboxWrapper />
                }
              />

              {/* 4. Leads List & Deep-Linked Lead Detail Routes */}
              <Route
                path="leads"
                element={
                  <LeadsWrapper />
                }
              />
              <Route
                path="leads/:id"
                element={
                  <LeadDetailRoute />
                }
              />

              {/* 5. Follow-ups Route */}
              <Route
                path="followups"
                element={
                  <FollowupsWrapper />
                }
              />

              {/* 6. Site Visits Route */}
              <Route
                path="visits"
                element={
                  <VisitsWrapper />
                }
              />

              {/* 7. Bookings Route */}
              <Route
                path="bookings"
                element={
                  <BookingsWrapper />
                }
              />

              {/* 8. Projects & Inventory Route */}
              <Route
                path="projects"
                element={
                  <ProjectsModule />
                }
              />

              {/* 9. Sales Team Performance Route (Owner & Team Leader Scoped) */}
              <Route
                path="team"
                element={
                  <RoleGuard
                    allowedRoles={['owner', 'team_leader']}
                    moduleTitle="Sales Team Performance"
                  >
                    <EmployeesModule />
                  </RoleGuard>
                }
              />
              <Route path="employees" element={<Navigate to="/team" replace />} />

              {/* 10. Analytics & Reports Route (Owner & Team Leader Scoped) */}
              <Route
                path="reports"
                element={
                  <RoleGuard
                    allowedRoles={['owner', 'team_leader']}
                    moduleTitle="Analytics & Reports"
                  >
                    <ReportsModule />
                  </RoleGuard>
                }
              />

              {/* 11. Meta Lead Integration Route (Strictly Company Owner ONLY) */}
              <Route
                path="meta"
                element={
                  <RoleGuard
                    allowedRoles={['owner']}
                    moduleTitle="Meta Lead Integration & Graph API"
                  >
                    <MetaIntegrationModule />
                  </RoleGuard>
                }
              />

              {/* 12. System Audit Logs Route (Strictly Company Owner ONLY) */}
              <Route
                path="audit"
                element={
                  <RoleGuard
                    allowedRoles={['owner']}
                    moduleTitle="System Immutable Audit Trail"
                  >
                    <AuditLogModule />
                  </RoleGuard>
                }
              />

              {/* 13. Wildcard Catch-All */}
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

// Wrapper helpers to inject router navigation seamlessly into existing component prop interfaces
const DashboardWrapper: React.FC = () => {
  const navigate = useNavigate();
  const context = useOutletContext<{ onOpenNewLeadModal: () => void }>();

  return (
    <Dashboard
      onSelectTab={(tab) => navigate(tab === 'team' || tab === 'employees' ? '/team' : `/${tab}`)}
      onSelectLead={(l) => navigate(`/leads/${l.id}`)}
      onSelectStage={(stage) => {
        if (stage === 'Site Visit' || stage === 'Visit done') {
          navigate('/visits');
        } else if (stage) {
          navigate(`/leads?stage=${encodeURIComponent(stage)}`);
        } else {
          navigate('/leads');
        }
      }}
      onOpenNewLeadModal={context?.onOpenNewLeadModal || (() => {})}
    />
  );
};

const TodaysWorkWrapper: React.FC = () => {
  const navigate = useNavigate();
  return (
    <TodaysWorkModule
      onSelectLead={(l) => navigate(`/leads/${l.id}`)}
      onSelectTab={(tab) => navigate(`/${tab}`)}
    />
  );
};

const InboxWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <SharedInbox onSelectLead={(l) => navigate(`/leads/${l.id}`)} />;
};

const LeadsWrapper: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const stageParam = searchParams.get('stage') || 'ALL';
  const context = useOutletContext<{ onOpenNewLeadModal: () => void }>();

  return (
    <LeadTable
      onSelectLead={(l) => navigate(`/leads/${l.id}`)}
      onOpenNewLeadModal={context?.onOpenNewLeadModal || (() => {})}
      initialStageFilter={stageParam}
      onResetStageFilter={() => {
        searchParams.delete('stage');
        setSearchParams(searchParams);
      }}
    />
  );
};

const FollowupsWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <FollowupModule onSelectLead={(l) => navigate(`/leads/${l.id}`)} />;
};

const VisitsWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <SiteVisitModule onSelectLead={(l) => navigate(`/leads/${l.id}`)} />;
};

const BookingsWrapper: React.FC = () => {
  const navigate = useNavigate();
  return <BookingModule onSelectLead={(l) => navigate(`/leads/${l.id}`)} />;
};
