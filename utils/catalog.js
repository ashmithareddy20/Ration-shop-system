const ITEM_CATALOG = [
  {
    key: "rice",
    name: "Rice",
    price: 50,
    monthlyLimit: 5,
    image: "images/rice.jpeg",
  },
  {
    key: "wheat",
    name: "Wheat",
    price: 40,
    monthlyLimit: 3,
    image: "images/wheat.jfif",
  },
  {
    key: "sugar",
    name: "Sugar",
    price: 45,
    monthlyLimit: 2,
    image: "images/sugar.jfif",
  },
  {
    key: "kerosene",
    name: "Kerosene",
    price: 30,
    monthlyLimit: 2,
    image: "images/kerosene.jfif",
  },
];

const DELIVERY_SLOTS = [
  "09:00-10:00",
  "10:00-11:00",
  "11:00-12:00",
  "12:00-13:00",
  "13:00-14:00",
  "14:00-15:00",
  "15:00-16:00",
];

const ONLINE_PAYMENT_METHODS = ["UPI", "Card", "NetBanking"];

function toNonNegativeInteger(value) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : 0;
}

function normalizeQuantities(payload = {}) {
  return ITEM_CATALOG.reduce((result, item) => {
    result[item.key] = toNonNegativeInteger(payload[item.key]);
    return result;
  }, {});
}

function hasAnyQuantity(quantities) {
  return ITEM_CATALOG.some((item) => quantities[item.key] > 0);
}

function getMonthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  return `${year}-${month}`;
}

function buildItemLines(quantities) {
  return ITEM_CATALOG.filter((item) => quantities[item.key] > 0).map((item) => ({
    itemKey: item.key,
    name: item.name,
    qty: quantities[item.key],
    price: item.price,
    amount: quantities[item.key] * item.price,
  }));
}

function findShopForUser(user, sellers) {
  if (!user || !Array.isArray(sellers) || sellers.length === 0) {
    return null;
  }

  const village = String(user.village || "").toLowerCase();
  return (
    sellers.find(
      (seller) => String(seller.village || "").toLowerCase() === village
    ) || sellers[0]
  );
}

function normalizeTransactionDocument(entry) {
  const list = Array.isArray(entry.items) ? entry.items : [];
  const items = list
    .map((line) => {
      const found = ITEM_CATALOG.find(
        (item) =>
          item.key === String(line.itemKey || line.key || "").toLowerCase() ||
          item.name.toLowerCase() === String(line.name || "").toLowerCase()
      );

      if (!found) {
        return null;
      }

      const qty = toNonNegativeInteger(line.qty);
      if (qty === 0) {
        return null;
      }

      return {
        itemKey: found.key,
        name: found.name,
        qty,
        price: found.price,
        amount: qty * found.price,
      };
    })
    .filter(Boolean);

  const fallbackItems = ITEM_CATALOG.map((item) => {
    const qty = toNonNegativeInteger(entry[item.key]);
    return {
      itemKey: item.key,
      name: item.name,
      qty,
      price: item.price,
      amount: qty * item.price,
    };
  }).filter((line) => line.qty > 0);

  const finalItems = items.length > 0 ? items : fallbackItems;
  const computedTotal = finalItems.reduce((sum, line) => sum + line.amount, 0);
  const total =
    Number.isFinite(Number(entry.total)) && Number(entry.total) > 0
      ? Number(entry.total)
      : computedTotal;

  return {
    ...entry,
    orderId:
      entry.orderId ||
      `${entry.shopId || "SHOP"}-${entry.rationCard || "RC"}-${String(
        entry.date || Date.now()
      )}`,
    items: finalItems,
    total,
  };
}

module.exports = {
  ITEM_CATALOG,
  DELIVERY_SLOTS,
  ONLINE_PAYMENT_METHODS,
  normalizeQuantities,
  hasAnyQuantity,
  buildItemLines,
  findShopForUser,
  normalizeTransactionDocument,
  getMonthKey,
  toNonNegativeInteger,
};
