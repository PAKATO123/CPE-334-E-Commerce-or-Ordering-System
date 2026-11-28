import React, { useEffect, useState } from "react";
import {
  getSalesSummaryApi,
  getTurnaroundMetricsApi,
  SalesSummaryData,
  TurnaroundMetricsData,
} from "../api";

type DateRangeFilter = "ALL" | "30D" | "7D" | "TODAY" | "CUSTOM";

export default function OperatorReportsPage() {
  const [range, setRange] = useState<DateRangeFilter>("ALL");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [summary, setSummary] = useState<SalesSummaryData | null>(null);
  const [turnaround, setTurnaround] = useState<TurnaroundMetricsData | null>(null);

  const calculateDateBounds = (filter: DateRangeFilter): { start?: string; end?: string } => {
    const now = new Date();
    if (filter === "TODAY") {
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      return { start: start.toISOString(), end: now.toISOString() };
    }
    if (filter === "7D") {
      const start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return { start: start.toISOString(), end: now.toISOString() };
    }
    if (filter === "30D") {
      const start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      return { start: start.toISOString(), end: now.toISOString() };
    }
    if (filter === "CUSTOM" && customStart && customEnd) {
      return {
        start: new Date(customStart).toISOString(),
        end: new Date(customEnd).toISOString(),
      };
    }
    return {};
  };

  const fetchReports = async () => {
    setLoading(true);
    setError(null);
    try {
      const bounds = calculateDateBounds(range);
      const [summaryRes, turnaroundRes] = await Promise.all([
        getSalesSummaryApi(bounds.start, bounds.end),
        getTurnaroundMetricsApi(),
      ]);
      setSummary(summaryRes.data);
      setTurnaround(turnaroundRes.data);
    } catch (err: any) {
      setError(err.message || "Failed to load reports data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [range]);

  const handleApplyCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (customStart && customEnd) {
      fetchReports();
    }
  };

  return (
    <div
      data-testid="reports-page"
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "24px 16px",
        fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, sans-serif)",
      }}
    >
      <div style={{ marginBottom: "24px" }}>
        <h1
          data-testid="reports-title"
          style={{
            fontSize: "26px",
            fontWeight: 800,
            color: "var(--color-text-main, #1A2E22)",
            marginBottom: "6px",
          }}
        >
          📊 Store Analytics & Fulfillment Reports
        </h1>
        <p style={{ fontSize: "14px", color: "var(--color-text-muted, #718096)", margin: 0 }}>
          Executive sales intelligence, order lifecycle status distribution, and carrier turnaround metrics.
        </p>
      </div>

      {/* Date Range Selector */}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          gap: "10px",
          backgroundColor: "var(--color-surface, #FFFFFF)",
          padding: "12px 18px",
          borderRadius: "var(--radius-md, 8px)",
          border: "1px solid var(--color-border, #E2E8F0)",
          marginBottom: "24px",
        }}
      >
        <span style={{ fontSize: "13px", fontWeight: 700, color: "var(--color-text-main, #1A2E22)" }}>
          Date Range:
        </span>
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {(
            [
              ["ALL", "All Time", "filter-all-btn"],
              ["TODAY", "Today", "filter-today-btn"],
              ["7D", "Last 7 Days", "filter-7d-btn"],
              ["30D", "Last 30 Days", "filter-30d-btn"],
              ["CUSTOM", "Custom Range", "filter-custom-btn"],
            ] as const
          ).map(([val, label, testId]) => (
            <button
              key={val}
              type="button"
              data-testid={testId}
              onClick={() => setRange(val)}
              className="tt-btn"
              style={{
                padding: "6px 14px",
                fontSize: "13px",
                fontWeight: range === val ? 700 : 500,
                backgroundColor: range === val ? "var(--color-primary-green, #006B3C)" : "#FFF",
                color: range === val ? "#FFF" : "var(--color-text-main, #1A2E22)",
                border: "1px solid var(--color-border, #E2E8F0)",
                borderRadius: "var(--radius-sm, 6px)",
                cursor: "pointer",
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {range === "CUSTOM" && (
          <form
            onSubmit={handleApplyCustom}
            style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "auto" }}
          >
            <input
              type="date"
              data-testid="custom-start-input"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              style={{
                padding: "5px 10px",
                border: "1px solid var(--color-border, #E2E8F0)",
                borderRadius: "var(--radius-sm, 6px)",
                fontSize: "13px",
              }}
            />
            <span style={{ fontSize: "13px", color: "var(--color-text-muted, #718096)" }}>to</span>
            <input
              type="date"
              data-testid="custom-end-input"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              style={{
                padding: "5px 10px",
                border: "1px solid var(--color-border, #E2E8F0)",
                borderRadius: "var(--radius-sm, 6px)",
                fontSize: "13px",
              }}
            />
            <button
              type="submit"
              data-testid="apply-custom-range-btn"
              className="tt-btn tt-btn-primary"
              style={{ padding: "6px 14px", fontSize: "13px" }}
            >
              Apply
            </button>
          </form>
        )}
      </div>

      {error && (
        <div
          data-testid="reports-error-banner"
          style={{
            backgroundColor: "var(--color-error-bg, #FFF5F5)",
            color: "var(--color-error, #C53030)",
            border: "1px solid var(--color-urgent-border, #FEB2B2)",
            padding: "12px 16px",
            borderRadius: "var(--radius-sm, 6px)",
            marginBottom: "20px",
            fontSize: "14px",
          }}
        >
          {error}
        </div>
      )}

      {loading && (
        <div style={{ textAlign: "center", padding: "40px 0", color: "var(--color-text-muted, #718096)" }}>
          Loading reporting metrics...
        </div>
      )}

      {!loading && summary && turnaround && (
        <>
          {/* Top KPI Cards */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: "16px",
              marginBottom: "28px",
            }}
          >
            <div
              className="tt-card"
              style={{
                backgroundColor: "var(--color-surface, #FFFFFF)",
                border: "1px solid var(--color-border, #E2E8F0)",
                borderRadius: "var(--radius-md, 8px)",
                padding: "20px",
              }}
            >
              <div style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--color-text-muted, #718096)", fontWeight: 700, marginBottom: "8px" }}>
                💰 Total Gross Revenue
              </div>
              <div
                data-testid="sales-summary-revenue"
                style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-primary-green, #006B3C)" }}
              >
                ${summary.totalRevenue}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted, #718096)", marginTop: "4px" }}>
                Excludes cancelled & rejected orders
              </div>
            </div>

            <div
              className="tt-card"
              style={{
                backgroundColor: "var(--color-surface, #FFFFFF)",
                border: "1px solid var(--color-border, #E2E8F0)",
                borderRadius: "var(--radius-md, 8px)",
                padding: "20px",
              }}
            >
              <div style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--color-text-muted, #718096)", fontWeight: 700, marginBottom: "8px" }}>
                📦 Total Order Volume
              </div>
              <div
                data-testid="sales-summary-orders"
                style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-main, #1A2E22)" }}
              >
                {summary.totalOrders}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted, #718096)", marginTop: "4px" }}>
                Across all fulfillment states
              </div>
            </div>

            <div
              className="tt-card"
              style={{
                backgroundColor: "var(--color-surface, #FFFFFF)",
                border: "1px solid var(--color-border, #E2E8F0)",
                borderRadius: "var(--radius-md, 8px)",
                padding: "20px",
              }}
            >
              <div style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--color-text-muted, #718096)", fontWeight: 700, marginBottom: "8px" }}>
                💳 Average Order Value (AOV)
              </div>
              <div
                data-testid="sales-summary-aov"
                style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-main, #1A2E22)" }}
              >
                ${summary.averageOrderValue}
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted, #718096)", marginTop: "4px" }}>
                Per non-terminal completed order
              </div>
            </div>

            <div
              className="tt-card"
              style={{
                backgroundColor: "var(--color-surface, #FFFFFF)",
                border: "1px solid var(--color-border, #E2E8F0)",
                borderRadius: "var(--radius-md, 8px)",
                padding: "20px",
              }}
            >
              <div style={{ fontSize: "12px", textTransform: "uppercase", color: "var(--color-text-muted, #718096)", fontWeight: 700, marginBottom: "8px" }}>
                ⏱️ Avg Shipped Turnaround
              </div>
              <div
                data-testid="reports-turnaround-avg"
                style={{ fontSize: "28px", fontWeight: 800, color: "var(--color-text-main, #1A2E22)" }}
              >
                {turnaround.averageTurnaroundHours} hrs
              </div>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted, #718096)", marginTop: "4px" }}>
                {turnaround.averageTurnaroundMinutes} mins ({turnaround.shippedOrderCount} shipped orders)
              </div>
            </div>
          </div>

          {/* Two-Column Distribution Section */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(400px, 1fr))",
              gap: "24px",
              marginBottom: "28px",
            }}
          >
            {/* Fulfillment Status Distribution */}
            <div
              className="tt-card"
              style={{
                backgroundColor: "var(--color-surface, #FFFFFF)",
                border: "1px solid var(--color-border, #E2E8F0)",
                borderRadius: "var(--radius-md, 8px)",
                padding: "22px",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "var(--color-text-main, #1A2E22)" }}>
                Fulfillment Status Breakdown
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {(
                  [
                    ["PENDING", "⏳ Pending", summary.statusCounts.PENDING, "var(--color-warning, #D69E2E)"],
                    ["ACCEPTED", "✓ Accepted", summary.statusCounts.ACCEPTED, "var(--color-primary-green, #006B3C)"],
                    ["PACKED", "📦 Packed", summary.statusCounts.PACKED, "#3182CE"],
                    ["SHIPPED", "🚚 Shipped", summary.statusCounts.SHIPPED, "#805AD5"],
                    ["CANCELLED", "✕ Cancelled", summary.statusCounts.CANCELLED, "var(--color-text-muted, #718096)"],
                    ["REJECTED", "⛔ Rejected", summary.statusCounts.REJECTED, "var(--color-error, #C53030)"],
                  ] as const
                ).map(([status, label, count, color]) => {
                  const pct = summary.totalOrders > 0 ? ((count / summary.totalOrders) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={status} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ fontWeight: 600, color: "var(--color-text-main, #1A2E22)" }}>{label}</span>
                        <span data-testid={`status-count-${status}`} style={{ fontWeight: 700, color }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: "6px",
                          backgroundColor: "var(--color-readonly-bg, #F0F4F1)",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            backgroundColor: color,
                            borderRadius: "3px",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Payment Status Breakdown */}
            <div
              className="tt-card"
              style={{
                backgroundColor: "var(--color-surface, #FFFFFF)",
                border: "1px solid var(--color-border, #E2E8F0)",
                borderRadius: "var(--radius-md, 8px)",
                padding: "22px",
              }}
            >
              <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "var(--color-text-main, #1A2E22)" }}>
                Payment Status Breakdown
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {(
                  [
                    ["UNPAID", "⚠️ Unpaid", summary.paymentStatusCounts.UNPAID, "var(--color-warning, #D69E2E)"],
                    ["PAID", "💳 Paid", summary.paymentStatusCounts.PAID, "var(--color-primary-green, #006B3C)"],
                    ["REFUNDED", "🔄 Refunded", summary.paymentStatusCounts.REFUNDED, "#3182CE"],
                    ["VOID", "🚫 Void", summary.paymentStatusCounts.VOID, "var(--color-text-muted, #718096)"],
                  ] as const
                ).map(([status, label, count, color]) => {
                  const pct = summary.totalOrders > 0 ? ((count / summary.totalOrders) * 100).toFixed(1) : "0.0";
                  return (
                    <div key={status} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                        <span style={{ fontWeight: 600, color: "var(--color-text-main, #1A2E22)" }}>{label}</span>
                        <span data-testid={`payment-status-count-${status}`} style={{ fontWeight: 700, color }}>
                          {count} ({pct}%)
                        </span>
                      </div>
                      <div
                        style={{
                          height: "6px",
                          backgroundColor: "var(--color-readonly-bg, #F0F4F1)",
                          borderRadius: "3px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            backgroundColor: color,
                            borderRadius: "3px",
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Turnaround Summary Subcard */}
              <div
                style={{
                  marginTop: "24px",
                  padding: "14px 16px",
                  backgroundColor: "var(--color-readonly-bg, #F0F4F1)",
                  borderRadius: "var(--radius-sm, 6px)",
                  border: "1px solid var(--color-border, #E2E8F0)",
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: 700, marginBottom: "8px", color: "var(--color-text-main, #1A2E22)" }}>
                  Turnaround Speed Extremes
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px" }}>
                  <span>⚡ Fastest Shipped:</span>
                  <span style={{ fontWeight: 600 }}>{turnaround.fastestTurnaroundMinutes} mins</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", marginTop: "4px" }}>
                  <span>🐢 Slowest Shipped:</span>
                  <span style={{ fontWeight: 600 }}>{turnaround.slowestTurnaroundMinutes} mins</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
