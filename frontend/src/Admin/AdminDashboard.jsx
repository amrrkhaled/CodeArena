import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ADMIN_TABS, ADMIN_TAB_CONTENT } from "./adminDashboardConfig";
import "../style/AdminDashboard.css";
import { useContext } from "react";
import { ContestContext } from "../context/ContextCreation";
import ContestSelect from "../Components/ContestSelect";
import ThemeToggle from "../Components/ThemeToggle";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { contests, selectedContestId, setSelectedContestId, refreshContests } = useContext(ContestContext);
  const activeTab = searchParams.get("tab") || "setup";
  const setActiveTab = (id) => setSearchParams({ tab: id }, { replace: false });

  useEffect(() => {
    refreshContests();
  }, [refreshContests]);

  const handleAdminLogout = () => {
    localStorage.removeItem("adminToken");
    navigate("/admin/login");
  };

  const activeContestCount = contests.filter((contest) => contest.is_active).length;
  const totalContestCount = contests.length;
  const currentTab = ADMIN_TAB_CONTENT[activeTab];

  return (
    <div className="admin-dashboard">
      <div className="admin-header">
        <div className="admin-header-copy">
          <span className="admin-kicker">Control Center</span>
          <h1>Admin Dashboard</h1>
          <p>Run contests, publish problem sets, manage teams, and monitor the event from one cleaner workspace.</p>
          <div className="admin-overview-grid">
            <div className="admin-overview-card">
              <span className="admin-overview-label">Total Contests</span>
              <strong>{totalContestCount}</strong>
            </div>
            <div className="admin-overview-card">
              <span className="admin-overview-label">Active Contests</span>
              <strong>{activeContestCount}</strong>
            </div>
          </div>
        </div>
        <div className="admin-header-actions">
          <ThemeToggle className="admin-theme-toggle" />
          <ContestSelect
            id="admin-contest-switcher"
            className="admin-contest-switcher"
            label=""
            options={contests}
            value={selectedContestId}
            onChange={(e) => setSelectedContestId(e.target.value)}
            placeholder="Choose contest"
            emptyLabel="No contests"
          />
          <button type="button" className="admin-logout-button" onClick={handleAdminLogout}>
            Logout
          </button>
        </div>
      </div>

      <div className="admin-tabs-shell">
        <div className="admin-tabs-list" role="tablist" aria-label="Admin dashboard sections">
          {ADMIN_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`admin-tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className="admin-tab-label">{tab.label}</span>
              <span className="admin-tab-description">{tab.description}</span>
            </button>
          ))}
        </div>

        <div className="admin-tab-panel">
          {currentTab && (
            <section className="admin-block">
              <div className="admin-block-heading">
                <h2>{currentTab.heading}</h2>
                <p>{currentTab.description}</p>
              </div>
              <div className={currentTab.layoutClassName || "admin-grid"}>
                {currentTab.sections.map((section, index) => {
                  const SectionComponent = section.component;
                  return (
                    <div
                      key={`${activeTab}-${index}`}
                      className={`admin-section ${section.fullWidth ? "admin-section-full" : ""}`.trim()}
                    >
                      {section.eyebrow && <span className="section-eyebrow">{section.eyebrow}</span>}
                      {section.title && <h2 className="section-title">{section.title}</h2>}
                      <SectionComponent />
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};
