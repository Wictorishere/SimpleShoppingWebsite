import { useCart } from "../../context/CartContext";

import "./AddToCartButton.css";

const formatter = new Intl.NumberFormat("fa-IR");

export default function AddToCartButton({ product }) {
  const { items, addItem } = useCart();

  const quantity =
    items.find(
      (item) => item.productId === String(product.id)
    )?.quantity ?? 0;

  const stock = Number(product.stock);

  const available =
    product.is_active !== false &&
    Number.isFinite(stock) &&
    stock >= 1;

  const limit = available
    ? Math.min(Math.floor(stock), 99)
    : 0;

  const reachedLimit = available && quantity >= limit;

  return (
    <div className="add-to-cart">
      <button
        type="button"
        className="add-to-cart__button"
        disabled={!available || reachedLimit}
        onClick={() => addItem(product)}
      >
        {!available
          ? "ناموجود"
          : reachedLimit
            ? "حداکثر تعداد مجاز در سبد"
            : "افزودن به سبد خرید"}
      </button>

      <span className="add-to-cart__status" role="status">
        {quantity > 0
          ? `${formatter.format(quantity)} عدد در سبد شما`
          : ""}
      </span>
    </div>
  );
}
