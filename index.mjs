import express from "express";
import { query } from "./src/common/config/db.js"
import { dirname } from "path";
import { fileURLToPath } from "url";
import cors from "cors";
import { authenticate } from "./src/modules/auth/auth.middleware.js";
import cookieParser from "cookie-parser";
import authRoute from "./src/modules/auth/auth.routes.js";
import ticketRoute from "./src/modules/booking-tickets/tickets.routes.js"
import ApiError from "./src/common/utils/api-error.js";
import ApiResponse from "./src/common/utils/api-response.js";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(cookieParser());

app.use("/api/auth", authRoute)
app.use("/api/tickets", ticketRoute)

const __dirname = dirname(fileURLToPath(import.meta.url));

const port = process.env.PORT || 8080;


app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html");
});

app.get("/auth", (req, res) => {
  res.sendFile(__dirname + "/auth.html");
});

app.get('/favicon.ico', (req, res) => res.sendFile(__dirname + '/favicon.ico'));
app.use('/.well-known', (req, res) => res.status(204).end());

//get all seats
app.get("/seats", async (req, res) => {
  const result = await query("select * from seats"); 
  ApiResponse.ok(res, "fetched seats", result.rows)
});

//book a seat give the seatId and your name

app.put("/:id", authenticate, async (req, res, next) => {
  const client = await getClient();
  try {
    const id = req.params.id;
    const name = req.user.name;
    
    await client.query("BEGIN");
    
    // FOR UPDATE locks exactly this seat row so no other user can double-book it during this transaction
    const sql = "SELECT * FROM seats where id = $1 and isbooked = 0 FOR UPDATE";
    const result = await client.query(sql, [id]);

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return next(ApiError.conflict("seat already booked"));
    }
    
    const ticketRes = await client.query("INSERT INTO tickets (user_id, name) Values ($1, $2) RETURNING id",
      [req.user.id, name]
    );
    const ticketId = ticketRes.rows[0].id;

    const sqlU = "UPDATE seats set isbooked = 1, name = $2, ticket_id = $3, user_id = $4 WHERE id = $1";
    await client.query(sqlU, [id, name, ticketId, req.user.id]); 

    await client.query("COMMIT");
    ApiResponse.ok(res, "seat booked successfully", { id, name });
  } catch (ex) {
    await client.query("ROLLBACK");
    console.error("Booking error:", ex);
    next(ApiError.badRequest("something went wrong"));
  } finally {
    // Crucial: Release the dedicated lock connection back to the pool
    client.release();
  }
});

app.use((req, res, next) => {
    next(ApiError.notFound(`Route ${req.originalUrl} not found`));
});

app.use((err, req, res, next) => {
  console.error("Express Error:", err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    message: err.message || "Internal Server Error",
    errors: err.errors || []
  });
});

app.listen(port, () => console.log("Server starting on port: " + port));
