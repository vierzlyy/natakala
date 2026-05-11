import { Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function AdminLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isNarrowViewport, setIsNarrowViewport] = useState(false);

  useEffect(() => {
    const syncSidebarByViewport = () => {
      setIsNarrowViewport(window.innerWidth < 1024);

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

  const handleToggleSidebar = () => {
    if (isNarrowViewport) {
      setMobileSidebarOpen((prev) => !prev);
      return;
    }

    setSidebarCollapsed((prev) => !prev);
  };

  return (
    <div className="admin-scene min-h-screen overflow-x-hidden px-3 py-4 sm:px-4 lg:p-6">
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

      {isNarrowViewport && mobileSidebarOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-30 bg-ink/35 backdrop-blur-[2px]"
          aria-label="Tutup menu navigasi"
          onClick={() => setMobileSidebarOpen(false)}
        />
      ) : null}

      <div
        className={[
          'relative mx-auto grid max-w-[1600px] gap-4 lg:z-10 lg:gap-6',
          isNarrowViewport
            ? 'grid-cols-1'
            : sidebarCollapsed
              ? 'lg:grid-cols-[96px_minmax(0,1fr)]'
              : 'lg:grid-cols-[290px_minmax(0,1fr)]',
        ].join(' ')}
      >
        <Sidebar
          collapsed={isNarrowViewport ? false : sidebarCollapsed}
          narrowMode={isNarrowViewport}
          mobileOpen={mobileSidebarOpen}
          onToggleCollapse={handleToggleSidebar}
          onCloseMobile={() => setMobileSidebarOpen(false)}
        />
        <main className="min-w-0 space-y-4 lg:space-y-6">
          <Topbar onOpenMenu={() => setMobileSidebarOpen(true)} showMenuButton={isNarrowViewport} />
          <div className="min-w-0 space-y-4 lg:space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
