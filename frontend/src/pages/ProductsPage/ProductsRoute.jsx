import {
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";

import ProductsPage from "./ProductsPage";

export default function ProductsRoute() {
  const navigate = useNavigate();
  const { categorySlug = "" } = useParams();
  const [searchParams] = useSearchParams();

  function handleSelectProduct(product) {
    if (!product.slug) {
      return;
    }

    navigate(
      `/products/${encodeURIComponent(product.slug)}`
    );
  }

  return (
    <ProductsPage
      categorySlug={categorySlug}
      search={searchParams.get("search") ?? ""}
      onSelect={handleSelectProduct}
    />
  );
}
