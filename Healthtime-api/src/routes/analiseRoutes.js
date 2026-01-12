const express = require("express");
const router = express.Router();
const analiseController = require("../controllers/analiseController");

// Estas rotas serão prefixadas com /api/analise no app.js

// Q1: Média Espera
router.get("/media-espera-observacao", analiseController.getMediaEsperaObservacao);

// Q2: Percentagem Triagem
router.get("/percentagem-triagem", analiseController.getPercentagemTriagem);

// Q3: Pediatria Região
router.get("/espera-pediatria-regiao", analiseController.getEsperaPediatriaRegiao);

// Q4: Oncologia
router.get("/diferenca-oncologia", analiseController.getDiferencaOncologia);

// Q5: Top 5 Especialidades (Consultas)
router.get("/top5-especialidades", analiseController.getTop5Especialidades);

// Q6: Tempo Médio Cirurgia por Hospital
router.get("/tempo-cirurgia-hospital", analiseController.getTempoCirurgiaPorHospital);

// -------------------------------

// Q7: Top 10 Pediatria (Nota: Confirme se a lógica no controller corresponde ao nome da rota)
router.get("/top10-pediatria", analiseController.getTop10Pediatria);

// Q8: Evolução Temporal
router.get("/evolucao-temporal", analiseController.getEvolucaoTemporal);

module.exports = router;