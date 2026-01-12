const express = require("express");
const router = express.Router();
const ingestionController = require("../controllers/ingestionController");

// Middleware para processar XML (necessário apenas nos POSTs)
const xmlMiddleware = require("../middlewares/xmlParser"); 

// --- ROTAS DE ESCRITA (POST) ---
// O prefixo /api vem do app.js. 
// URL Final: http://localhost:3000/api/urgencias
router.post("/urgencias", xmlMiddleware, ingestionController.createUrgencia);
router.post("/consultas", xmlMiddleware, ingestionController.createConsulta);
router.post("/cirurgias", xmlMiddleware, ingestionController.createCirurgia); 

// --- ROTAS DE LEITURA (GET) ---
// URL Final: http://localhost:3000/api/hospitais
router.get("/api/urgencias", ingestionController.getUrgencias);
router.get("/api/consultas", ingestionController.getConsultas);
router.get("/api/cirurgias", ingestionController.getCirurgias);
router.get("/api/hospitais", ingestionController.getHospitais);
router.get("/api/servicos", ingestionController.getServicos);

module.exports = router;