"use client";

import ReservationHistoryView from "@/app/owner/_ReservationHistoryView";
import { useParams } from "next/navigation";

export default function RestaurantReservationsPage() {
  const params = useParams();
  const restaurantId = String(params.id);

  return <ReservationHistoryView restaurantId={restaurantId} />;
}
