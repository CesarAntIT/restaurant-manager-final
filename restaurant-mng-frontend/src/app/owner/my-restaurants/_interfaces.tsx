interface restaurantReq {
  id: number;
  ownerId: string;
  name: string;
  category: string;
  status: string;
  address: string;
  phoneNumber: string;
  createdAt: string;
  images: string[];
}

interface RestaurantFormProps {
  mode: "create" | "edit";
  restaurant?: restaurantReq;
  user?: { id: string } | null;
  token: string | null;
  onClose: () => void;
  onSuccess: (newRestaurant?: restaurantReq) => void;
  setError: (err: string | null) => void;
  API_URL: string
}