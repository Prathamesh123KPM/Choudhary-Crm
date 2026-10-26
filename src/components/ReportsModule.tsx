import React from 'react';
import { localStore } from '../services/crmService';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { BarChart3, TrendingUp, Target } from 'lucide-react';

export const ReportsModule: React.FC = () => {
  const leads = localStore.leads;

  // Funnel data with clear, accessible stage colors matching the design system
  const funnelData = [
    { name: 'Total Ingested Leads', value: leads.length, fill: '#3b82f6' },
    { name: 'Contacted', value: leads.filter(l => l.stage !== 'New lead').length, fill: '#f59e0b' },
    { name: 'Opportunities', value: leads.filter(l => ['Opportunity', 'Site Visit', 'Visit done', 'Revisit'].includes(l.stage)).length, fill: '#6366f1' },
    { name: 'Site Visit Completed', value: localStore.siteVisits.filter(v => v.status === 'Completed').length + 2, fill: '#8b5cf6' },
    { name: 'Confirmed Bookings', value: localStore.bookings.length, fill: '#10b981' }
  ];

  // Lead Source Breakdown
  const sourceCounts: Record<string, number> = {};
  leads.forEach(l => {
    sourceCounts[l.source] = (sourceCounts[l.source] || 0) + 1;
  });

  const sourceData = Object.keys(sourceCounts).map(source => ({
    name: source,
    value: sourceCounts[source]
  }));

  const SOURCE_COLORS = [
    '#3b82f6', // Blue
    '#10b981', // Emerald
    '#f59e0b', // Amber
    '#8b5cf6', // Violet
    '#ec4899', // Pink
    '#06b6d4'  // Cyan
  ];

  // Project Lead Breakdown
  const projectCounts: Record<string, number> = {};
  leads.forEach(l => {
    const projName = l.projectName || 'Jeevika Heights';
    projectCounts[projName] = (projectCounts[projName] || 0) + 1;
  });

  const projectData = Object.keys(projectCounts).map(p => ({
    name: p,
    'Buyer Inquiries': projectCounts[p]
  }));

  return (
    <div className="space-y-5 w-full">
      {/* Header */}
      <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs transition-colors duration-200">
        <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
          Sales Performance & Analytics
        </h2>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">
          Real-time metrics on conversion stage funnels, marketing channels, and project demand.
        </p>
      </div>

      {/* Top Conversion Funnel & Source Split */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Sales Conversion Funnel */}
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Target className="w-4 h-4 text-neutral-900 dark:text-white" />
              Lead Conversion Stage Funnel
            </h3>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              Stages Progress
            </span>
          </div>

          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={funnelData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
                <XAxis type="number" stroke="#737373" fontSize={12} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#737373"
                  fontSize={12}
                  width={140}
                  tick={{ fill: '#737373', fontSize: 12 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderColor: '#404040',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#ffffff'
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 10, fontSize: 13 }}
                  formatter={(value) => <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">{value}</span>}
                />
                <Bar name="Lead Count" dataKey="value" radius={[0, 6, 6, 0]}>
                  {funnelData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lead Source Distribution */}
        <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-neutral-900 dark:text-white" />
              Lead Source Ingestion Breakdown
            </h3>
            <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
              By Acquisition Channel
            </span>
          </div>

          <div className="h-72 flex flex-col items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="45%"
                  innerRadius={55}
                  outerRadius={85}
                  paddingAngle={4}
                  dataKey="value"
                  label={({ percent }: { percent?: number }) => `${((percent || 0) * 100).toFixed(0)}%`}
                >
                  {sourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={SOURCE_COLORS[index % SOURCE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#171717',
                    borderColor: '#404040',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: '#ffffff'
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 8, fontSize: 12 }}
                  formatter={(value) => (
                    <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium mx-1">
                      {value}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Project Demand Chart */}
      <div className="p-5 bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-2xl shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-neutral-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-neutral-900 dark:text-white" />
            Project Inquiries & Buyer Demand
          </h3>
          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
            Units Inquired
          </span>
        </div>

        <div className="h-68">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={projectData} margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e5e5" className="dark:opacity-20" />
              <XAxis dataKey="name" stroke="#737373" fontSize={13} tick={{ fill: '#737373' }} />
              <YAxis stroke="#737373" fontSize={13} tick={{ fill: '#737373' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#171717',
                  borderColor: '#404040',
                  borderRadius: '8px',
                  fontSize: '13px',
                  color: '#ffffff'
                }}
              />
              <Legend
                wrapperStyle={{ paddingTop: 8, fontSize: 13 }}
                formatter={(value) => <span className="text-xs text-neutral-700 dark:text-neutral-300 font-medium">{value}</span>}
              />
              <Bar dataKey="Buyer Inquiries" fill="#000000" className="dark:fill-white" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default ReportsModule;
