"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cars_js_1 = __importDefault(require("./routes/cars.js"));
const auth_js_1 = __importDefault(require("./routes/auth.js"));
const matches_js_1 = __importDefault(require("./routes/matches.js"));
const cars_js_2 = __importDefault(require("./routes/admin/cars.js"));
const users_js_1 = __importDefault(require("./routes/admin/users.js"));
const error_js_1 = require("./middleware/error.js");
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: "10mb" }));
app.use("/api/cars", cars_js_1.default);
app.use("/api/auth", auth_js_1.default);
app.use("/api/matches", matches_js_1.default);
app.use("/api/admin/cars", cars_js_2.default);
app.use("/api/admin/users", users_js_1.default);
app.use(error_js_1.errorHandler);
app.listen(PORT, () => {
    console.log(`AutoMatch API rodando em http://localhost:${PORT}/api`);
});
//# sourceMappingURL=index.js.map