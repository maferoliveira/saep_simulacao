
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = 3000;

const usuarioRoutes = require("./src/routes/usuarioRoutes");
const discoRoutes = require("./src/routes/discoRoutes");
const estoqueRoutes = require("./src/routes/estoqueRoutes");
const vendaRoutes = require("./src/routes/vendaRoutes");

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    sistema: "Vinyl Control API",
    status: "online"
  });
});

app.use("/usuarios", usuarioRoutes);
app.use("/discos", discoRoutes);
app.use("/estoque", estoqueRoutes);
app.use("/vendas", vendaRoutes);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
