'use client';

import React from 'react';
import type { PlatformViewsProps } from './types';
import {
  usePlatformSchoolsState,
  buildSortingHatDatabase,
  filterSortingHat,
} from './use-platform-state';
import { DashboardView } from './views/dashboard-view';
import { SchoolsView } from './views/schools-view';
import { UsersView } from './views/users-view';
import { BillingView } from './views/billing-view';
import { AnalyticsView } from './views/analytics-view';
import { MonitoringView } from './views/monitoring-view';
import { AuditLogsView } from './views/audit-logs-view';
import { SettingsView } from './views/settings-view';

export function PlatformViews({
  activeItem,
  schools,
  setSchools,
  onOpenSchoolWorkspace,
}: PlatformViewsProps) {
  const state = usePlatformSchoolsState(schools, setSchools);

  const sortingHatDatabase = buildSortingHatDatabase(schools);
  const filteredSortingHatResults = filterSortingHat(
    sortingHatDatabase,
    state.sortingHatQuery,
    state.sortingHatFilter,
  );

  const filteredSchools = schools.filter((school) => {
    const matchesSearch =
      school.name.toLowerCase().includes(state.schoolSearch.toLowerCase()) ||
      school.domain.toLowerCase().includes(state.schoolSearch.toLowerCase()) ||
      school.code.toLowerCase().includes(state.schoolSearch.toLowerCase());
    const matchesStatus = state.statusFilter === 'All' || school.status === state.statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Render view by activeItem
  switch (activeItem) {
    case 'platform-dashboard':
    default:
      return (
        <DashboardView
          schools={schools}
          onOpenSchoolWorkspace={onOpenSchoolWorkspace}
          sortingHatQuery={state.sortingHatQuery}
          setSortingHatQuery={state.setSortingHatQuery}
          sortingHatFilter={state.sortingHatFilter}
          setSortingHatFilter={state.setSortingHatFilter}
          filteredSortingHatResults={filteredSortingHatResults}
        />
      );

    case 'platform-schools':
      return (
        <SchoolsView
          schools={schools}
          onOpenSchoolWorkspace={onOpenSchoolWorkspace}
          schoolSearch={state.schoolSearch}
          setSchoolSearch={state.setSchoolSearch}
          statusFilter={state.statusFilter}
          setStatusFilter={state.setStatusFilter}
          viewMode={state.viewMode}
          setViewMode={state.setViewMode}
          showCreateModal={state.showCreateModal}
          setShowCreateModal={state.setShowCreateModal}
          newSchoolName={state.newSchoolName}
          setNewSchoolName={state.setNewSchoolName}
          newSchoolDomain={state.newSchoolDomain}
          setNewSchoolDomain={state.setNewSchoolDomain}
          newSchoolCode={state.newSchoolCode}
          setNewSchoolCode={state.setNewSchoolCode}
          handleCreateSchool={state.handleCreateSchool}
          handleToggleStatus={state.handleToggleStatus}
          handleDeleteSchool={state.handleDeleteSchool}
          filteredSchools={filteredSchools}
        />
      );

    case 'platform-users':
      return <UsersView />;

    case 'platform-billing':
      return <BillingView />;

    case 'platform-analytics':
      return <AnalyticsView />;

    case 'platform-monitoring':
      return <MonitoringView />;

    case 'platform-audit-logs':
      return <AuditLogsView />;

    case 'platform-settings':
      return <SettingsView />;
  }
}

// Re-export shared types for external usage
export type { PlatformViewsProps } from './types';
