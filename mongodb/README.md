# MongoDB Seed Data

This folder contains ready-to-run seed data for the `rationDB` MongoDB database.

## File

- `seed-rationdb.mongosh.js`

## Run with `mongosh`

```bash
mongosh "mongodb://127.0.0.1:27017/rationDB" mongodb/seed-rationdb.mongosh.js
```

## Collections created

- `users`
- `sellers`
- `stocks`
- `transactions`
- `deliverypersons`
- `monthlyitems`

The script clears these collections first, inserts sample data, and creates useful indexes.

After seeding and starting the app, admins can manage MongoDB-backed operations from:

- `http://localhost:3000/admin_dashboard.html`

This includes:

- adding users
- assigning village delivery persons
- setting item availability, price, and monthly limits for each month
