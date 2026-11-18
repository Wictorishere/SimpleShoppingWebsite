
import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

const CartContext = createContext(null);

const STORAGE_KEY = "shop:guest-cart:v1";
const MAX_QUANTITY = 99;

function validId(value) {
  return (
    (typeof value === "number" &&
      Number.isSafeInteger(value) &&
      value > 0) ||
    (typeof value === "string" && value.trim().length > 0)
  );
}

function readCart() {
  try {
    const stored = JSON.parse(
      localStorage.getItem(STORAGE_KEY) || "[]"
    );

    if (!Array.isArray(stored)) return [];

    const uniqueItems = new Map();

    for (const item of stored) {
      if (
        !validId(item?.productId) ||
        !Number.isInteger(item?.quantity) ||
        item.quantity < 1
      ) {
        continue;
      }

      const productId = String(item.productId);

      uniqueItems.set(productId, {
        productId,
        slug: typeof item.slug === "string" ? item.slug : "",
        quantity: Math.min(item.quantity, MAX_QUANTITY),
      });
    }

    return [...uniqueItems.values()];
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readCart);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(items)
      );
    } catch {
      // اگر ذخیره‌سازی مرورگر در دسترس نباشد،
      // سبد همچنان در حافظه همین صفحه کار می‌کند.
    }
  }, [items]);

  function addItem(product) {
    if (!validId(product?.id)) return;

    const stock = Number(product.stock);

    if (!Number.isFinite(stock) || stock < 1) return;

    const productId = String(product.id);
    const limit = Math.min(
      Math.floor(stock),
      MAX_QUANTITY
    );

    setItems((previous) => {
      const existing = previous.find(
        (item) => item.productId === productId
      );

      if (!existing) {
        return [
          ...previous,
          {
            productId,
            slug: product.slug ?? "",
            quantity: 1,
          },
        ];
      }

      return previous.map((item) =>
        item.productId === productId
          ? {
              ...item,
              slug: product.slug ?? item.slug ?? "",
              quantity: Math.min(
                item.quantity + 1,
                limit
              ),
            }
          : item
      );
    });
  }

  function removeItem(productId) {
    setItems((previous) =>
      previous.filter(
        (item) => item.productId !== String(productId)
      )
    );
  }

  function setQuantity(productId, quantity, stock) {
    const availableStock = Number(stock);

    if (
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      !Number.isFinite(availableStock) ||
      availableStock < 1
    ) {
      return;
    }

    const limit = Math.min(
      Math.floor(availableStock),
      MAX_QUANTITY
    );

    setItems((previous) =>
      previous.map((item) =>
        item.productId === String(productId)
          ? {
              ...item,
              quantity: Math.min(quantity, limit),
            }
          : item
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalQuantity = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        totalQuantity,
        addItem,
        removeItem,
        setQuantity,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart باید داخل CartProvider استفاده شود."
    );
  }

  return context;
}
