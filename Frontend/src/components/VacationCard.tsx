import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import type { Vacation } from "../types/Vacation";
import { imageUrl } from "../utils/api";
import { formatDate, formatPrice } from "../utils/format";

const STATUS_TEXT = {
  ended: "Ended",
  active: "Active now",
  upcoming: "Upcoming"
};

interface VacationCardProps {
  vacation: Vacation;
  isAdmin: boolean;                           // admin: Edit + Delete · user: Like
  likeLoading: boolean;                       // the like request of THIS card is on its way
  onToggleLike: (vacation: Vacation) => void;
  onDelete: (vacation: Vacation) => void;
}

export default function VacationCard({ vacation, isAdmin, likeLoading, onToggleLike, onDelete }: VacationCardProps) {
  // the current filter + page, so "Update" / "Cancel" on the edit page bring the admin back to the same place
  const location = useLocation();

  // the image is missing on the server → show a colored background instead of a broken image
  const [imageFailed, setImageFailed] = useState<boolean>(false);

  return (
    <div className="vacation-card">
      <div className="card-image">
        {imageFailed ? (
          <div className="image-fallback">🌴</div>
        ) : (
          <img src={imageUrl(vacation.imageFileName)} alt={vacation.destination} onError={() => setImageFailed(true)} />
        )}

        {isAdmin ? (
          <div className="admin-actions">
            <Link className="card-action" to={`/admin/edit/${vacation._id}`} state={{ from: location.search }} aria-label={`Edit ${vacation.destination}`}>
              ✎ Edit
            </Link>
            <button className="card-action" onClick={() => onDelete(vacation)} aria-label={`Delete ${vacation.destination}`}>
              🗑 Delete
            </button>
          </div>
        ) : (
          <button
            className={vacation.isLiked ? "like-btn liked" : "like-btn"}
            onClick={() => onToggleLike(vacation)}
            disabled={likeLoading}
            title={vacation.isLiked ? "Remove your like" : "Like this vacation"}
            aria-label={`${vacation.isLiked ? "Remove your like from" : "Like"} ${vacation.destination}, ${vacation.likesCount} ${vacation.likesCount === 1 ? "like" : "likes"}`}
            aria-pressed={vacation.isLiked}
          >
            {vacation.isLiked ? "♥" : "♡"} Like {vacation.likesCount}
          </button>
        )}

        <span className={`status-badge ${vacation.status}`}>{STATUS_TEXT[vacation.status]}</span>

        <h3 className="card-destination">{vacation.destination}</h3>
      </div>

      <div className="card-dates">
        📅 {formatDate(vacation.startDate)} – {formatDate(vacation.endDate)}
      </div>

      <p className="card-description">{vacation.description}</p>

      <div className="card-price">{formatPrice(vacation.price)}</div>
    </div>
  );
}
