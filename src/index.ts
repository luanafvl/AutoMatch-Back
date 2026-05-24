import "dotenv/config";
import express from "express";
import cors from "cors";
import carsRouter from "./routes/cars.js";
import authRouter from "./routes/auth.js";
import matchesRouter from "./routes/matches.js";
import adminCarsRouter from "./routes/admin/cars.js";
import adminUsersRouter from "./routes/admin/users.js";
import { errorHandler } from "./middleware/error.js";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/api/cars", carsRouter);
app.use("/api/auth", authRouter);
app.use("/api/matches", matchesRouter);
app.use("/api/admin/cars", adminCarsRouter);
app.use("/api/admin/users", adminUsersRouter);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`AutoMatch API rodando em http://localhost:${PORT}/api`);
});
