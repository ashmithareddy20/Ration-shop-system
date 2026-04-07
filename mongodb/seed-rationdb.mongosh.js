use("rationDB");

db.users.deleteMany({});
db.sellers.deleteMany({});
db.stocks.deleteMany({});
db.transactions.deleteMany({});
db.deliverypersons.deleteMany({});
db.monthlyitems.deleteMany({});

db.users.insertMany([
  {
    name: "Ravi Kumar",
    rationCard: "RC101",
    aadhaar: "123456789012",
    village: "Kothapalli",
    phone: "9876543210",
    password: "1234"
  },
  {
    name: "Sita Devi",
    rationCard: "RC102",
    aadhaar: "987654321012",
    village: "Ramapuram",
    phone: "9123456780",
    password: "1234"
  },
  {
    name: "Arjun Reddy",
    rationCard: "RC103",
    aadhaar: "456789123012",
    village: "Madhavaram",
    phone: "9012345678",
    password: "1234"
  },
  {
    name: "Lakshmi Priya",
    rationCard: "RC104",
    aadhaar: "321654987012",
    village: "Kothapalli",
    phone: "9988776655",
    password: "1234"
  },
  {
    name: "Rahul Sharma",
    rationCard: "RC105",
    aadhaar: "789456123012",
    village: "Ramapuram",
    phone: "9871234560",
    password: "1234"
  }
]);

db.sellers.insertMany([
  {
    shopId: "S01",
    name: "Mahesh Kumar",
    village: "Kothapalli",
    phone: "9999991111",
    password: "seller123",
    openTime: "09:00",
    closeTime: "16:00",
    isClosed: false,
    leaveNote: ""
  },
  {
    shopId: "S02",
    name: "Ramesh Gupta",
    village: "Ramapuram",
    phone: "8888882222",
    password: "seller123",
    openTime: "09:00",
    closeTime: "16:00",
    isClosed: false,
    leaveNote: ""
  },
  {
    shopId: "S03",
    name: "Suresh Naidu",
    village: "Madhavaram",
    phone: "7777773333",
    password: "seller123",
    openTime: "09:00",
    closeTime: "16:00",
    isClosed: false,
    leaveNote: ""
  }
]);

db.stocks.insertMany([
  {
    shopId: "S01",
    rice: 500,
    wheat: 300,
    sugar: 100,
    kerosene: 200
  },
  {
    shopId: "S02",
    rice: 598,
    wheat: 249,
    sugar: 150,
    kerosene: 299
  },
  {
    shopId: "S03",
    rice: 700,
    wheat: 400,
    sugar: 200,
    kerosene: 350
  }
]);

db.deliverypersons.insertMany([
  {
    village: "Kothapalli",
    name: "Ramu Delivery",
    phone: "9001112223",
    isActive: true
  },
  {
    village: "Ramapuram",
    name: "Sanjay Delivery",
    phone: "9001112224",
    isActive: true
  },
  {
    village: "Madhavaram",
    name: "Vijay Delivery",
    phone: "9001112225",
    isActive: true
  }
]);

db.monthlyitems.insertMany([
  {
    monthKey: "2026-04",
    itemKey: "rice",
    name: "Rice",
    price: 50,
    monthlyLimit: 5,
    isAvailable: true,
    image: "images/rice.jpeg"
  },
  {
    monthKey: "2026-04",
    itemKey: "wheat",
    name: "Wheat",
    price: 40,
    monthlyLimit: 3,
    isAvailable: true,
    image: "images/wheat.jfif"
  },
  {
    monthKey: "2026-04",
    itemKey: "sugar",
    name: "Sugar",
    price: 45,
    monthlyLimit: 2,
    isAvailable: true,
    image: "images/sugar.jfif"
  },
  {
    monthKey: "2026-04",
    itemKey: "kerosene",
    name: "Kerosene",
    price: 30,
    monthlyLimit: 2,
    isAvailable: true,
    image: "images/kerosene.jfif"
  }
]);

db.transactions.insertMany([
  {
    orderId: "S01-RC101-2026-03-20",
    rationCard: "RC101",
    userName: "Ravi Kumar",
    shopId: "S01",
    village: "Kothapalli",
    items: [
      { itemKey: "rice", name: "Rice", qty: 5, price: 50, amount: 250 },
      { itemKey: "wheat", name: "Wheat", qty: 3, price: 40, amount: 120 },
      { itemKey: "sugar", name: "Sugar", qty: 1, price: 45, amount: 45 }
    ],
    total: 415,
    rice: 5,
    wheat: 3,
    sugar: 1,
    kerosene: 0,
    monthKey: "2026-03",
    deliverySlot: "10:00-11:00",
    paymentMethod: "UPI",
    paymentStatus: "Paid Online",
    paymentReference: "PAY-1774930001001",
    deliveryPerson: { village: "Kothapalli", name: "Ramu Delivery", phone: "9001112223" },
    date: "2026-03-20T00:00:00.000Z"
  },
  {
    orderId: "S02-RC102-2026-03-21",
    rationCard: "RC102",
    userName: "Sita Devi",
    shopId: "S02",
    village: "Ramapuram",
    items: [
      { itemKey: "rice", name: "Rice", qty: 4, price: 50, amount: 200 },
      { itemKey: "wheat", name: "Wheat", qty: 2, price: 40, amount: 80 },
      { itemKey: "sugar", name: "Sugar", qty: 1, price: 45, amount: 45 }
    ],
    total: 325,
    rice: 4,
    wheat: 2,
    sugar: 1,
    kerosene: 0,
    monthKey: "2026-03",
    deliverySlot: "11:00-12:00",
    paymentMethod: "Card",
    paymentStatus: "Paid Online",
    paymentReference: "PAY-1774930001002",
    deliveryPerson: { village: "Ramapuram", name: "Sanjay Delivery", phone: "9001112224" },
    date: "2026-03-21T00:00:00.000Z"
  },
  {
    orderId: "S03-RC103-2026-03-22",
    rationCard: "RC103",
    userName: "Arjun Reddy",
    shopId: "S03",
    village: "Madhavaram",
    items: [
      { itemKey: "rice", name: "Rice", qty: 6, price: 50, amount: 300 },
      { itemKey: "wheat", name: "Wheat", qty: 3, price: 40, amount: 120 },
      { itemKey: "sugar", name: "Sugar", qty: 2, price: 45, amount: 90 }
    ],
    total: 510,
    rice: 6,
    wheat: 3,
    sugar: 2,
    kerosene: 0,
    monthKey: "2026-03",
    deliverySlot: "09:00-10:00",
    paymentMethod: "NetBanking",
    paymentStatus: "Paid Online",
    paymentReference: "PAY-1774930001003",
    deliveryPerson: { village: "Madhavaram", name: "Vijay Delivery", phone: "9001112225" },
    date: "2026-03-22T00:00:00.000Z"
  },
  {
    orderId: "S01-RC104-2026-03-22",
    rationCard: "RC104",
    userName: "Lakshmi Priya",
    shopId: "S01",
    village: "Kothapalli",
    items: [
      { itemKey: "rice", name: "Rice", qty: 5, price: 50, amount: 250 },
      { itemKey: "wheat", name: "Wheat", qty: 2, price: 40, amount: 80 },
      { itemKey: "sugar", name: "Sugar", qty: 1, price: 45, amount: 45 }
    ],
    total: 375,
    rice: 5,
    wheat: 2,
    sugar: 1,
    kerosene: 0,
    monthKey: "2026-03",
    deliverySlot: "13:00-14:00",
    paymentMethod: "UPI",
    paymentStatus: "Paid Online",
    paymentReference: "PAY-1774930001004",
    deliveryPerson: { village: "Kothapalli", name: "Ramu Delivery", phone: "9001112223" },
    date: "2026-03-22T00:00:00.000Z"
  },
  {
    orderId: "S02-RC105-2026-03-23",
    rationCard: "RC105",
    userName: "Rahul Sharma",
    shopId: "S02",
    village: "Ramapuram",
    items: [
      { itemKey: "rice", name: "Rice", qty: 4, price: 50, amount: 200 },
      { itemKey: "wheat", name: "Wheat", qty: 3, price: 40, amount: 120 },
      { itemKey: "sugar", name: "Sugar", qty: 1, price: 45, amount: 45 }
    ],
    total: 365,
    rice: 4,
    wheat: 3,
    sugar: 1,
    kerosene: 0,
    monthKey: "2026-03",
    deliverySlot: "14:00-15:00",
    paymentMethod: "Card",
    paymentStatus: "Paid Online",
    paymentReference: "PAY-1774930001005",
    deliveryPerson: { village: "Ramapuram", name: "Sanjay Delivery", phone: "9001112224" },
    date: "2026-03-23T00:00:00.000Z"
  },
  {
    orderId: "ORD-1774933621779",
    rationCard: "RC102",
    userName: "Sita Devi",
    shopId: "S02",
    village: "Ramapuram",
    items: [
      { itemKey: "rice", name: "Rice", qty: 2, price: 50, amount: 100 },
      { itemKey: "wheat", name: "Wheat", qty: 1, price: 40, amount: 40 },
      { itemKey: "kerosene", name: "Kerosene", qty: 1, price: 30, amount: 30 }
    ],
    total: 170,
    rice: 2,
    wheat: 1,
    sugar: 0,
    kerosene: 1,
    monthKey: "2026-03",
    deliverySlot: "15:00-16:00",
    paymentMethod: "UPI",
    paymentStatus: "Paid Online",
    paymentReference: "PAY-1774933621779",
    deliveryPerson: { village: "Ramapuram", name: "Sanjay Delivery", phone: "9001112224" },
    date: "2026-03-31T05:07:01.779Z"
  }
]);

db.users.createIndex({ rationCard: 1 }, { unique: true });
db.sellers.createIndex({ shopId: 1 }, { unique: true });
db.stocks.createIndex({ shopId: 1 }, { unique: true });
db.transactions.createIndex({ orderId: 1 }, { unique: true });
db.transactions.createIndex({ rationCard: 1, date: -1 });
db.transactions.createIndex({ shopId: 1, date: -1 });
db.deliverypersons.createIndex({ village: 1 }, { unique: true });
db.monthlyitems.createIndex({ monthKey: 1, itemKey: 1 }, { unique: true });

print("Seed complete for rationDB.");
printjson({
  users: db.users.countDocuments(),
  sellers: db.sellers.countDocuments(),
  stocks: db.stocks.countDocuments(),
  transactions: db.transactions.countDocuments(),
  deliverypersons: db.deliverypersons.countDocuments(),
  monthlyitems: db.monthlyitems.countDocuments()
});
