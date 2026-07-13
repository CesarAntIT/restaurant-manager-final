import { useState } from "react";

export default function RestaurantForm({
  mode,
  restaurant,
  user,
  token,
  onClose,
  onSuccess,
  setError,
  API_URL,
}: RestaurantFormProps) {
  const isEdit = mode === "edit";
  const MAX_IMAGES = 4;
  
  //Used to create the form
  const [formData, setFormData] = useState({
    name: restaurant?.name ?? "",
    category: restaurant?.category ?? "",
    address: restaurant?.address ?? "",
    phoneNumber: restaurant?.phoneNumber ?? "",
  });

  //Handles Image submissions and Max Images
  const [selectedImages, setSelectedImages] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    if (e.target.files.length > MAX_IMAGES) {
      setImageError(`Solo puedes subir un máximo de ${MAX_IMAGES} imágenes.`);
      setSelectedImages(null);
      e.target.value = "";
      return;
    }

    setImageError(null);
    setSelectedImages(e.target.files);
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (selectedImages && selectedImages.length > MAX_IMAGES) {
      setImageError(`Solo puedes subir un máximo de ${MAX_IMAGES} imágenes.`);
      return;
    }

    if (!token) return;
    if (mode === "create" && !user) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const data = new FormData();

      if (isEdit && restaurant) {
        data.append("name", formData.name.trim() || restaurant.name);
        data.append(
          "category",
          formData.category.trim() || restaurant.category,
        );
        data.append("address", formData.address.trim() || restaurant.address);
        data.append(
          "phoneNumber",
          formData.phoneNumber.trim() || restaurant.phoneNumber,
        );
      } else {
        // Create: fields are required by the inputs themselves.
        data.append("ownerId", user?.id || "");
        data.append("name", formData.name);
        data.append("category", formData.category);
        data.append("address", formData.address);
        data.append("phoneNumber", formData.phoneNumber);
      }

      if (selectedImages && selectedImages.length > 0) {
        Array.from(selectedImages).forEach((file) => {
          data.append("images", file);
        });
      } else if (isEdit) {
        // Preserves original edit behavior of sending a placeholder
        // when no new images were selected.
        data.append("images", "string");
      }

      const url = isEdit
        ? `${API_URL}/api/restaurants/${restaurant?.id}`
        : `${API_URL}/api/restaurants`;
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: data,
      });

      if (!res.ok) {
        throw new Error(
          isEdit
            ? "Error al intentar actualizar el restaurante en el servidor."
            : "Error al intentar crear el restaurante",
        );
      }

      const result = isEdit ? undefined : await res.json();
      onSuccess(result?.data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className={`w-full absolute z-50 rounded-${
        isEdit ? "[2rem]" : "4xl"
      } border border-white/10 bg-[#0f0906]/95 p-6 shadow-2xl shadow-black/60 backdrop-blur-3xl sm:p-8 mb-5 left-0 ${
        isEdit ? "top-0" : "top-20"
      }`}
    >
      <h2 className="text-2xl font-bold text-white mb-1">
        {isEdit ? "Editar Restaurante" : "Registrar Nuevo Restaurante"}
      </h2>

      {isEdit && restaurant && (
        <p className="text-sm text-stone-400 mb-4">
          Modificando los datos de:{" "}
          <span className="text-amber-400 font-semibold">
            {restaurant.name}
          </span>
        </p>
      )}

      <form
        onSubmit={handleSubmit}
        className={`space-y-4 ${isEdit ? "text-left" : ""} ${
          isEdit ? "" : "mt-4"
        }`}
      >
        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">
            Nombre
          </label>
          <input
            type="text"
            name="name"
            required={!isEdit}
            value={formData.name}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            placeholder={isEdit ? restaurant?.name : "El Gran Encuentro...."}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">
            Categoría
          </label>
          <input
            type="text"
            name="category"
            required={!isEdit}
            value={formData.category}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            placeholder={
              isEdit
                ? restaurant?.category
                : "Ej. Sushi, Carnes Finas, Mariscos "
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">
            Dirección
          </label>
          <input
            type="text"
            name="address"
            required={!isEdit}
            value={formData.address}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            placeholder={isEdit ? restaurant?.address : "Ej. Calle Falsa 123"}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">
            Teléfono
          </label>
          <input
            type="text"
            name="phoneNumber"
            required={!isEdit}
            value={formData.phoneNumber}
            onChange={handleInputChange}
            className="w-full rounded-lg border border-[#2e1910] bg-[#1a100a] px-3 py-2 text-sm text-white outline-none focus:border-amber-500"
            placeholder={
              isEdit
                ? restaurant?.phoneNumber == null
                  ? "809-000-0000"
                  : restaurant.phoneNumber.trim()
                : "809-000-000"
            }
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-stone-300 mb-1">
            {isEdit
              ? "Actualizar imágenes (Opcional)"
              : `Imágenes del local (max. ${MAX_IMAGES})`}
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="w-full text-sm text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-amber-500/20 file:text-amber-200 hover:file:bg-amber-500/30 cursor-pointer"
          />
          {imageError && (
            <p className="mt-1 text-sm text-red-400">{imageError}</p>
          )}
          {!isEdit && selectedImages && (
            <p className="mt-1 text-sm text-stone-400">
              {selectedImages.length} / {MAX_IMAGES} imágenes seleccionadas
            </p>
          )}
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            disabled={isSubmitting}
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-stone-300 hover:text-white disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            className={`rounded-xl px-5 py-2 text-sm font-bold text-black transition disabled:opacity-50 ${
              isEdit
                ? "bg-amber-400 hover:bg-amber-500 active:bg-amber-600"
                : "bg-green-500 hover:bg-green-400 active:bg-green-600"
            }`}
          >
            {isSubmitting
              ? isEdit
                ? "Actualizando..."
                : "Guardando..."
              : isEdit
                ? "Guardar Cambios"
                : "Guardar Restaurante"}
          </button>
        </div>
      </form>
    </div>
  );
}
