const express = require("express");
const router = express.Router();

const vendaController = require("../controllers/vendaController");

router.get("/", vendaController.listarVendas);
router.get("/:id", vendaController.buscarVendaPorId);
router.post("/", vendaController.registrarVenda);
router.patch("/:id/cancelar", vendaController.cancelarVenda);

module.exports = router;