import { useMemo } from "react"
import { motion } from "framer-motion"
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
  createColumnHelper,
} from "@tanstack/react-table"
import { useAlertStore } from "../store/useAlertStore.js"
import { useFilteredAlerts } from "../store/useAlertStore.js"
import { scoreLabel } from "../utils/scoringEngine.js"
import "./QueueTable.css"

const columnHelper = createColumnHelper()

function StatusBadge({ status }) {
  const cls = {
    new: "status-badge status-new",
    investigating: "status-badge status-investigating",
    resolved: "status-badge status-resolved",
  }[status]
  return <span className={cls}>{status}</span>
}

function ScoreCell({ value }) {
  const { color } = scoreLabel(value)
  const pct = Math.round(value * 100)
  return (
    <div className="score-wrap">
      <span className="score-num">{pct}</span>
      <div className="score-track">
        <div
          className="score-fill"
          style={{ "--fill-width": `${pct}%`, "--fill-color": color }}
        />
      </div>
    </div>
  )
}

function QueueTable() {
  const rankedAlerts = useFilteredAlerts()
  const selectedAlertId = useAlertStore((s) => s.selectedAlertId)
  const selectAlert = useAlertStore((s) => s.selectAlert)
  const setComparison = useAlertStore((s) => s.setComparison)

  const handleClick = (e, id) => {
    if (e.shiftKey) {
      setComparison((prev) => {
        if (prev[0] === null) return [id, null]
        if (prev[1] === null) return prev[0] === id ? prev : [prev[0], id]
        return [id, null]
      })
      return
    }
    selectAlert(id)
  }

  const columns = useMemo(
    () => [
      columnHelper.display({ id: "rank", header: "Rank", cell: (i) => <span className="rank-cell">{i.row.original.rank}</span> }),
      columnHelper.accessor("id", { header: "ID", cell: (i) => <span className="id-cell">{i.getValue()}</span> }),
      columnHelper.accessor("type", { header: "Type" }),
      columnHelper.accessor("score", { header: "Risk Score", cell: (i) => <ScoreCell value={i.getValue()} /> }),
      columnHelper.accessor("factors.severity", { header: "Severity", cell: (i) => i.getValue() }),
      columnHelper.accessor("factors.affectedUsers", {
        header: "Users",
        cell: (i) => i.getValue().toLocaleString(),
      }),
      columnHelper.accessor("factors.attackConfidence", {
        header: "Confidence",
        cell: (i) => `${Math.round(i.getValue() * 100)}%`,
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
    return <div className="empty-state">No alerts loaded. Load a batch to begin.</div>
  }

  return (
    <div className="queue-table-wrap">
      <table className="queue-table">
        <thead>
          {table.getHeaderGroups().map((hg) => (
            <tr key={hg.id}>
              {hg.headers.map((header) => (
                <th key={header.id}>
                  {flexRender(header.column.columnDef.header, header.getContext())}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => {
            const selected = row.original.id === selectedAlertId
            return (
              <motion.tr
                key={row.original.id}
                layout
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={selected ? "row-selected" : undefined}
                onClick={(e) => handleClick(e, row.original.id)}
              >
                {row.getVisibleCells().map((cell) => (
                  <td key={cell.id} className="queue-cell">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </td>
                ))}
              </motion.tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

export default QueueTable
