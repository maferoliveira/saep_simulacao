const express = require("express");
const router = express.Router();

const estoqueController = require("../controllers/estoqueController");

router.get("/", estoqueController.listarEstoque);
router.get("/historico", estoqueController.listarHistorico);
router.post("/", estoqueController.registrarMovimentacao);

module.exports = router;