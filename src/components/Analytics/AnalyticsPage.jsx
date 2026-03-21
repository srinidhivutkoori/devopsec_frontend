// components/Analytics/AnalyticsPage.jsx
// Container page for all analytics views at /analytics.
// Renders CollaborationAnalytics and UsagePrediction components in a
// single scrollable page, separated by a section divider.

import CollaborationAnalytics from './CollaborationAnalytics'
import UsagePrediction from './UsagePrediction'

/**
 * AnalyticsPage
 * Full analytics page combining collaboration patterns and usage prediction.
 */
export default function AnalyticsPage() {
  return (
    <div className="max-w-screen-xl mx-auto space-y-8">
      {/* Page header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Analytics</h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Insights into team collaboration and predicted board activity
        </p>
      </div>

      {/* Collaboration patterns section */}
      <CollaborationAnalytics />

      {/* Visual section divider */}
      <hr className="border-slate-200" />

      {/* Usage prediction section */}
      <UsagePrediction />
    </div>
  )
}
