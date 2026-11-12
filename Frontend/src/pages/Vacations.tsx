import { useCallback, useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import { API_URL, authHeaders, getErrorMessage } from "../utils/api";
import VacationCard from "../components/VacationCard";
import FilterBar from "../components/FilterBar";
import Pagination from "../components/Pagination";
import ConfirmDialog from "../components/ConfirmDialog";
import type { LikeResult, Vacation, VacationFilter, VacationsPage } from "../types/Vacation";

const FILTERS: VacationFilter[] = ["all", "liked", "active", "upcoming"];

const EMPTY_TEXT: Record<VacationFilter, string> = {
  all: "There are no vacations yet.",
  liked: "You haven't liked any vacation yet. Press ♡ Like on a vacation to see it here.",
  active: "No vacation is active right now.",
  upcoming: "There are no upcoming vacations."
};

// The vacations page of the user (/vacations) AND the admin page (/admin) — the routes decide who gets in,
// the page shows each role its own buttons: user → Like · admin → Add / Edit / Delete
export default function Vacations() {
  const { user, token, logout } = useUser();
  const isAdmin = user?.role === "admin";
  const location = useLocation();

  // The filter and the page live in the address (?filter=active&page=2) — a refresh or Back keeps them.
  // A wrong value in the address falls back to the default instead of breaking the page.
  const [searchParams, setSearchParams] = useSearchParams();
  const filterParam = searchParams.get("filter") as VacationFilter | null;
  const filter: VacationFilter =
    filterParam && FILTERS.includes(filterParam) && !(isAdmin && filterParam === "liked") ? filterParam : "all";
  const pageParam = Number(searchParams.get("page") ?? 1);
  const page = Number.isInteger(pageParam) && pageParam >= 1 ? pageParam : 1;

  const [data, setData] = useState<VacationsPage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [likeLoadingIds, setLikeLoadingIds] = useState<string[]>([]); // the cards whose like is on its way
  const [reloadKey, setReloadKey] = useState<number>(0);               // +1 = load the same page again

  // admin: the vacation waiting for "are you sure?" + the message after add / edit / delete
  const [toDelete, setToDelete] = useState<Vacation | null>(null);
  const [deleting, setDeleting] = useState<boolean>(false);
  const [message, setMessage] = useState<string>((location.state as { message?: string } | null)?.message ?? "");

  // the message came in the navigation state — clear it there, so a refresh does not show it again
  const navigate = useNavigate();
  useEffect(() => {
    if (location.state) navigate(location.pathname + location.search, { replace: true, state: null });
  }, [location, navigate]);

  useEffect(() => {
    // the stale-response guard: switching pages fast sends several requests —
    // only the answer of the LAST one may reach the screen
    let ignore = false;

    async function getVacations() {
      setLoading(true);
      setError("");
      try {
        const response = await fetch(`${API_URL}/vacations?filter=${filter}&page=${page}`, {
          headers: authHeaders(token)
        });

        if (response.status === 401) {
          logout();                 // the token expired → back to Login
          return;
        }
        if (!response.ok) {
          throw new Error(await getErrorMessage(response, "Failed to load vacations"));
        }

        const result: VacationsPage = await response.json();
        if (ignore) return;

        // this page no longer exists (e.g. after removing likes on the last page) → go to the last one
        if (result.totalPages > 0 && page > result.totalPages) {
          setSearchParams(buildParams(filter, result.totalPages));
          return;
        }

        setData(result);
      } catch {
        if (!ignore) setError("Failed to load the vacations");
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    getVacations();

    return () => {
      ignore = true;
    };
  }, [filter, page, token, logout, reloadKey, setSearchParams]);

  function changeFilter(newFilter: VacationFilter) {
    setSearchParams(buildParams(newFilter, 1));   // a new filter starts from page 1
  }

  function changePage(newPage: number) {
    setSearchParams(buildParams(filter, newPage));
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function toggleLike(vacation: Vacation) {
    setLikeLoadingIds((ids) => [...ids, vacation._id]);
    setError("");
    try {
      const response = await fetch(`${API_URL}/vacations/${vacation._id}/like`, {
        method: vacation.isLiked ? "DELETE" : "POST",
        headers: authHeaders(token)
      });

      if (response.status === 401) {
        logout();
        return;
      }
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to update the like"));
      }

      const result: LikeResult = await response.json();

      if (filter === "liked" && !result.isLiked) {
        // the vacation leaves "My likes" → load the page again (the count and the pages change)
        setReloadKey((key) => key + 1);
      } else {
        // update only this card, with the numbers the server returned
        setData((current) => current && {
          ...current,
          vacations: current.vacations.map((v) =>
            v._id === result.vacationId ? { ...v, isLiked: result.isLiked, likesCount: result.likesCount } : v
          )
        });
      }
    } catch {
      setError("Failed to update the like, please try again");
    } finally {
      setLikeLoadingIds((ids) => ids.filter((id) => id !== vacation._id));
    }
  }

  async function deleteVacation() {
    if (!toDelete) return;

    setDeleting(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/vacations/${toDelete._id}`, {
        method: "DELETE",
        headers: authHeaders(token)
      });

      if (response.status === 401) {
        logout();
        return;
      }
      if (!response.ok) {
        throw new Error(await getErrorMessage(response, "Failed to delete the vacation"));
      }

      setMessage(`"${toDelete.destination}" was deleted`);
      setToDelete(null);
      setReloadKey((key) => key + 1);   // load the page again (counts and pages change)
    } catch {
      setToDelete(null);
      setError("Failed to delete the vacation, please try again");
    } finally {
      setDeleting(false);
    }
  }

  // the same function on every render, because ConfirmDialog uses it inside useEffect
  const closeDialog = useCallback(() => setToDelete(null), []);

  const vacations = data?.vacations ?? [];
  const from = data ? (data.page - 1) * data.pageSize + 1 : 0;
  const to = from + vacations.length - 1;

  return (
    <div className="page wide">
      <div className="page-header">
        <h1>{isAdmin ? "Manage Vacations" : "Vacations"}</h1>
        {isAdmin && <Link className="btn btn-primary" to="/admin/add">+ Add Vacation</Link>}
      </div>

      <FilterBar filter={filter} showLiked={!isAdmin} onChange={changeFilter} />

      {message && (
        <p className="status success">
          {message} <button className="link-btn" onClick={() => setMessage("")} aria-label="Close message">✕</button>
        </p>
      )}
      {error && <p className="status error">{error}</p>}
      {loading && <p className="status">Loading vacations...</p>}

      {data && !loading && vacations.length === 0 && !error && (
        <p className="status">{EMPTY_TEXT[filter]}</p>
      )}

      {data && vacations.length > 0 && (
        <>
          <p className="summary">
            Showing {from}–{to} of {data.total} vacations
          </p>

          <div className={loading ? "vacations-grid loading" : "vacations-grid"}>
            {vacations.map((v) => (
              <VacationCard
                key={v._id}
                vacation={v}
                isAdmin={isAdmin}
                likeLoading={likeLoadingIds.includes(v._id)}
                onToggleLike={toggleLike}
                onDelete={setToDelete}
              />
            ))}
          </div>

          <Pagination page={data.page} totalPages={data.totalPages} onChange={changePage} />
        </>
      )}

      {toDelete && (
        <ConfirmDialog
          title="Delete vacation?"
          message={`Are you sure you want to delete "${toDelete.destination}"? Its likes and its image will be deleted too.`}
          confirmText="Delete"
          loading={deleting}
          onConfirm={deleteVacation}
          onCancel={closeDialog}
        />
      )}
    </div>
  );
}

// ?filter=...&page=... — the defaults ("all", page 1) are left out to keep the address clean
function buildParams(filter: VacationFilter, page: number): Record<string, string> {
  const params: Record<string, string> = {};
  if (filter !== "all") params.filter = filter;
  if (page > 1) params.page = String(page);
  return params;
}
