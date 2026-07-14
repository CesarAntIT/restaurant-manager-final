//These reviews are meant for the clients, review history.
// For general review component either make them, or use the existing ones
"use client";
import Link from "next/link";
import { useState } from "react";

interface Reviews {
  id: number;
  restaurantId: number;
  restaurantName: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export default function ProfileReviews({ r }: { r: Reviews }) {
  const [showComment, setShowComment] = useState(false);
  const reviewDate = new Date(r.createdAt);

  return (
    <li className="m-6 mt-7">
      <div className="flex justify-between">
        <Link
          href={`/restaurants/${r.restaurantId}`}
          className="font-bold text-2xl italic text-white"
        >
          {r.restaurantName}
        </Link>

        <div>
          <h4 className="italic font-mono">
            {reviewDate.toLocaleDateString()}
          </h4>
          <h3 className="text-xs italic font-mono">
            {reviewDate.toLocaleTimeString()}
          </h3>
        </div>
      </div>
      <h3 className="text-lg italic font-mono">
        Rating: {Array.from({ length: r.rating }).map((_, i) => "\u2605")}
      </h3>
      <p
        className={`wrap-break-word ${showComment ? "" : "line-clamp-2"} max-w-150 mt-5 ml-0.5`}
      >
        {r.comment}
      </p>
      <button
        className="hover:bg-white/10 p-1 pl-2 pr-2 mb-1 rounded-xl italic "
        onClick={() => setShowComment(!showComment)}
      >
        {showComment ? "Show Less" : "Show More"}
      </button>
    </li>
  );
}
