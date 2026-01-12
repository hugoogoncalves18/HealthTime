const { XMLParser } = require("fast-xml-parser");
const validator = require("xsd-schema-validator");
const express = require("express");
const path = require("path");
const fs = require("fs");

const parser = new XMLParser({
  explicitArray: false,
  ignoreAttributes: true,
  numberParseOptions: {
    hex: true,
    leadingZeros: false,
  },
});

const xmlMiddleware = [
  // 1. Ler o corpo como texto
  express.text({ type: ["application/xml", "text/xml"] }),

  // 2. Validar XSD e Converter para JSON
  async (req, res, next) => {
    if (
      req.get("Content-type") &&
      (req.get("Content-type").includes("xml")) &&
      typeof req.body === "string"
    ) {
      console.log(`--> Recebida requisição XML em: ${req.originalUrl}`);

      // Lógica para escolher o ficheiro XSD correto baseada no URL
      let schemaFile = "";
      const url = req.originalUrl.toLowerCase();

      if (url.includes("urgencias")) {
        // CORREÇÃO: "urgencia.xsd" (minúsculo, conforme a tua lista de ficheiros)
        schemaFile = "urgencia.xsd"; 
      } else if (url.includes("consultas")) {
        schemaFile = "Consulta.xsd";
      } else if (url.includes("cirurgias")) {
        schemaFile = "Cirurgia.xsd";
      } else {
        return next();
      }

      // CORREÇÃO: Caminho aponta para 'models' em vez de 'moddles'
      const absoluteSchemaPath = path.join(process.cwd(), "src", "models", "schemas", schemaFile);

      console.log(`🔍 Procurando XSD em: ${absoluteSchemaPath}`);

      if (!fs.existsSync(absoluteSchemaPath)) {
        console.error("❌ Erro: XSD não encontrado!");
        return res.status(500).json({ 
            erro: "Ficheiro XSD não encontrado no servidor.",
            caminhoTentado: absoluteSchemaPath 
        });
      }

      try {
        // Validação XSD rigorosa
        await validator.validateXML(req.body.trim(), absoluteSchemaPath);
        
        // Se passou, converte
        const parsed = parser.parse(req.body);
        req.body = parsed;
        console.log("✅ XML Válido e Convertido.");
        next();

      } catch (err) {
        console.error("❌ Falha na Validação XSD:", err.message);
        return res.status(400).json({
          status: "error",
          message: "O XML não cumpre as regras do XSD.",
          details: err.message
        });
      }
    } else {
      next();
    }
  },
];

module.exports = xmlMiddleware;