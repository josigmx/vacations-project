import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useUser } from "../contexts/UserContext";
import { API_URL, authHeaders, getErrorMessage } from "../utils/api";
import type { LikesReportRow } from "../types/Vacation";

export default function Reports() {
  const { token, logout } = useUser();

  const [rows, setRows] = useState<LikesReportRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [downloading, setDownloading] = useState<boolean>(false);
  const [downloadError, setDownloadError] = useState<string>("");

  useEffect(() => {
    let ignore = false;   // stale-response guard

    async function getReport() {
      try {
        const response = await fetch(`${API_URL}/reports/likes`, { headers: authHeaders(token) });

        if (response.status === 401) {
          logout();
          return;
        }
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, "Failed to load the report"));
        }

        const data: LikesReportRow[] = await response.json();
        if (!ignore) setRows(data);
      } catch {
        if (!ignore) setError("Failed to load the report");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    getReport();

    return () => {
      ignore = true;
    };
  }, [token, logout]);

  // The CSV needs the token, so a plain <a href> cannot download it:
  // fetch it → turn the answer into a file in memory → click a temporary link to save it
  async function downloadCsv() {
    setDownloading(true);
    setDownloadError("");
    try {
      const response = await fetch(`${API_URL}/reports/csv`, { headers: authHeaders(token) });

      if (response.status === 401) {
        logout();
        return;
      }
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to create the CSV file"));
      }

      const file = await response.blob();
      const url = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = url;
      link.download = "Vacation Likes.csv";
      link.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);   // release the memory once the download started
    } catch {
      setDownloadError("Failed to download the CSV file, please try again");
    } finally {
      setDownloading(false);
    }
  }

  const totalLikes = rows.reduce((sum, row) => sum + row.likes, 0);

  return (
    <div className="page wide">
      <div className="page-header">
        <h1>Vacations Report</h1>
        <button className="btn btn-primary" onClick={downloadCsv} disabled={downloading}>
          {downloading ? "Preparing..." : "⬇ Download CSV"}
        </button>
      </div>

      {downloadError && <p className="status error">{downloadError}</p>}
      {loading && <p className="status">Loading report...</p>}
      {error && <p className="status error">{error}</p>}

      {!loading && !error && rows.length === 0 && <p className="status">There are no vacations yet.</p>}

      {!loading && !error && rows.length > 0 && (
        <div className="report-card">
          <p className="summary">
            {rows.length} vacations · {totalLikes} likes in total
          </p>

          {/* X = destination · Y = number of likes */}
          <ResponsiveContainer width="100%" height={420}>
            <BarChart data={rows} margin={{ top: 10, right: 10, left: 0, bottom: 90 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="destination" interval={0} angle={-40} textAnchor="end" tick={{ fontSize: 12 }} />
              <YAxis allowDecimals={false} label={{ value: "Likes", angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Bar dataKey="likes" name="Likes" fill="#2c3e50" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
