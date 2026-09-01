import { useMemo, useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table"
import { useAlertStore } from "../store/useAlertStore.js"
import { useFilteredAlerts } from "../store/useAlertStore.js"
import { scoreLabel, generateSingleJustification } from "../utils/scoringEngine.js"
import { generateAlerts } from "../utils/mockAlerts.js"
import { fetchJustification } from "../services/api.js"
import "./QueueTable.css"

const columnHelper = createColumnHelper()

const aiCache = new Map()

function StatusBadge({ status }) {
  const cls = {
    new: "status-badge status-new",
    investigating: "status-badge status-investigating",
    resolved: "status-badge status-resolved",
  }[status]
  return <span className={cls}>{status}</span>
}

function ScoreCell({ value, policyDelta }) {
  const { color } = scoreLabel(value)
  const pct = Math.round(value * 100)
  const hasDelta = policyDelta !== undefined && Math.abs(policyDelta) > 0.005
  const deltaPct = hasDelta ? Math.round(policyDelta * 100) : 0
  return (
    <div className="score-wrap">
      <span className="score-num">{pct}</span>
      {hasDelta && (
        <span className={`score-delta ${deltaPct > 0 ? "score-delta-up" : "score-delta-down"}`}>
          {deltaPct > 0 ? "↑" : "↓"}{Math.abs(deltaPct)}
        </span>
      )}
      <div className="score-track">
        <div
          className="score-fill"
          style={{ "--fill-width": `${pct}%`, "--fill-color": color }}
        />
      </div>
    </div>
  )
}

function JustificationRow({ alert }) {
  const templateText = generateSingleJustification(alert)
  const scoringMode = useAlertStore((s) => s.scoringMode)
  const shouldFetch = scoringMode === "ml" && !aiCache.has(alert.id) && !!alert.breakdown?.weighted
  const [aiText, setAiText] = useState(() => aiCache.get(alert.id) || "")
  const [loading, setLoading] = useState(shouldFetch)

  useEffect(() => {
    if (!shouldFetch) return

    let cancelled = false
    fetchJustification({
      id: alert.id,
      type: alert.type,
      score: Math.round(alert.score * 100),
      rank: alert.rank,
      factors: alert.factors,
      breakdown: alert.breakdown,
      policyNotes: alert.policyNotes || [],
    })
      .then((text) => {
        if (!cancelled && text) {
          aiCache.set(alert.id, text)
          setAiText(text)
        }
      })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false) })

    return () => { cancelled = true }
  }, [alert.id, shouldFetch]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <motion.tr
      className="justification-row"
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.2 }}
    >
      <td colSpan={8} className="justification-cell">
        <div className="justification-inner">
          <div className="justification-template">{templateText}</div>
          {loading && (
            <div className="justification-ai-loading">
              <span className="justification-ai-dot" />
              Generating AI analysis…
            </div>
          )}
          {aiText && (
            <div className="justification-ai">
              <span className="justification-ai-badge">✨ AI</span>
              {aiText}
            </div>
          )}
          {alert.policyNotes?.length > 0 && (
            <div className="justification-policies">
              {alert.policyNotes.map((n) => (
                <span key={n.label} className="justification-policy-tag">{n.label}: {n.text}</span>
              ))}
            </div>
          )}
        </div>
      </td>
    </motion.tr>
  )
}

function EmptyState() {
  const setFilter = useAlertStore((s) => s.setFilter)

  return (
    <div className="empty-state-card">
      <div className="empty-state-icon">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <h2 className="empty-state-title">No matching incidents</h2>
      <p className="empty-state-desc">
        No incidents match your current filter criteria.
      </p>
      <div className="empty-state-actions">
        <button
          type="button"
          className="empty-state-btn empty-state-btn-primary"
          onClick={() => {
            setFilter("search", "")
            setFilter("type", "all")
            setFilter("criticality", "all")
            setFilter("status", "all")
            setFilter("timeRange", "all")
            setFilter("severityMin", 1)
            setFilter("severityMax", 10)
          }}
        >
          Clear Filters
        </button>
      </div>
    </div>
  )
}

function QueueTable() {
  const rankedAlerts = useFilteredAlerts()
  const selectedAlertId = useAlertStore((s) => s.selectedAlertId)
  const selectAlert = useAlertStore((s) => s.selectAlert)
  const setComparison = useAlertStore((s) => s.setComparison)
  const [expandedId, setExpandedId] = useState(null)

  const handleClick = useCallback((e, id) => {
    if (e.shiftKey) {
      setComparison((prev) => {
        if (prev[0] === null) return [id, null]
        if (prev[1] === null) return prev[0] === id ? prev : [prev[0], id]
        return [id, null]
      })
      return
    }
    selectAlert(id)
    setExpandedId((prev) => (prev === id ? null : id))
  }, [selectAlert, setComparison])

  const columns = useMemo(
    () => [
      columnHelper.display({ id: "rank", header: "Rank", cell: (i) => <span className="rank-cell">{i.row.original.rank}</span> }),
      columnHelper.accessor("id", { header: "ID", cell: (i) => <span className="id-cell">{i.getValue()}</span> }),
      columnHelper.accessor("type", { header: "Type" }),
      columnHelper.accessor("score", {
        header: "Risk Score",
        cell: (i) => <ScoreCell value={i.getValue()} policyDelta={i.row.original.policyDelta} />,
      }),
      columnHelper.accessor("factors.severity", { header: "Severity", cell: (i) => i.getValue() }),
      columnHelper.accessor("factors.affectedUsers", {
        header: "Users",
        cell: (i) => i.getValue().toLocaleString(),
        meta: { hideNarrow: true },
      }),
      columnHelper.accessor("factors.attackConfidence", {
        header: "Confidence",
        cell: (i) => `${Math.round(i.getValue() * 100)}%`,
        meta: { hideNarrow: true },
      }),
      columnHelper.accessor("status", { header: "Status", cell: (i) => <StatusBadge status={i.getValue()} /> }),
    ],
    []
  )

  const table = useReactTable({
    data: rankedAlerts,
    columns,
    getCoreRowModel: getCoreRowModel(),
  })

  if (rankedAlerts.length === 0) {
    return <EmptyState />
  }

  return (
    <div className="queue-table-wrap">
      <table className="queue-table">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th key={header.id} className={header.column.columnDef.meta?.hideNarrow ? "hide-narrow" : ""}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          <AnimatePresence>
            {table.getRowModel().rows.map((row) => {
              const selected = row.original.id === selectedAlertId
              const expanded = row.original.id === expandedId
              return [
                <motion.tr
                  key={row.original.id}
                  layout
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className={`${selected ? "row-selected" : ""} ${expanded ? "row-expanded" : ""}`}
                  onClick={(e) => handleClick(e, row.original.id)}
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className={`queue-cell ${cell.column.columnDef.meta?.hideNarrow ? "hide-narrow" : ""}`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </motion.tr>,
                expanded && (
                  <JustificationRow key={`just-${row.original.id}`} alert={row.original} />
                ),
              ]
            })}
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  )
}

export default QueueTable
