const express = require("express");
const router = express.Router();

const discoController = require("../controllers/discoController");

router.get("/", discoController.listarDiscos);
router.get("/:id", discoController.buscarDiscoPorId);
router.post("/", discoController.cadastrarDisco);
router.put("/:id", discoController.atualizarDisco);
router.delete("/:id", discoController.excluirDisco);

module.exports = router;