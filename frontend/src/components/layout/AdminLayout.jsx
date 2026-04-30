import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);
  const [isCompactViewport, setIsCompactViewport] = useState(false);

  useEffect(() => {
    const syncSidebarByViewport = () => {
      setIsNarrowViewport(window.innerWidth < 1024);
      setIsCompactViewport(window.innerWidth < 640);

      if (window.innerWidth < 1280) {
        setSidebarCollapsed(true);
      }

      if (window.innerWidth >= 1024) {
        setMobileSidebarOpen(false);
      }
    };

    syncSidebarByViewport();
    window.addEventListener('resize', syncSidebarByViewport);

    return () => window.removeEventListener('resize', syncSidebarByViewport);
  }, []);

  const effectiveCollapsed = isNarrowViewport ? !mobileSidebarOpen : sidebarCollapsed;
  const handleToggleSidebar = () => {
    if (isNarrowViewport) {
      setMobileSidebarOpen((prev) => !prev);
      return;
    }

    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="admin-scene min-h-screen p-4 lg:p-6">
      <div className="admin-blob admin-blob-peach" />
      <div className="admin-blob admin-blob-coral" />
      <div className="admin-blob admin-blob-gold" />
      <div className="admin-blob admin-blob-amber" />
      <div className="admin-blob admin-blob-blue" />
      <div className="admin-blob admin-blob-sky" />
      <div className="admin-blob admin-blob-green" />
      <div className="admin-blob admin-blob-mint" />
      <div className="admin-blob admin-blob-rose" />
      <div className="admin-dots admin-dots-top" />
      <div className="admin-dots admin-dots-bottom" />
      <div className="admin-waves" />

      <div
        className={[
          'relative z-10 mx-auto grid max-w-[1600px] gap-6',
          isNarrowViewport
            ? effectiveCollapsed
              ? isCompactViewport
                ? 'grid-cols-[88px_minmax(0,1fr)]'
                : 'grid-cols-[112px_minmax(0,1fr)]'
              : isCompactViewport
                ? 'grid-cols-[180px_minmax(0,1fr)]'
                : 'grid-cols-[220px_minmax(0,1fr)]'
            : sidebarCollapsed
              ? 'lg:grid-cols-[96px_minmax(0,1fr)]'
              : 'lg:grid-cols-[290px_minmax(0,1fr)]',
        ].join(' ')}
      >
        <Sidebar
          collapsed={effectiveCollapsed}
          narrowMode={isNarrowViewport}
          mobileOpen={mobileSidebarOpen}
          onToggleCollapse={handleToggleSidebar}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
        <main className="space-y-6">
          <Topbar />
          <div className="space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
