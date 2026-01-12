const mongoose = require('mongoose');

const consultaSchema = new mongoose.Schema({
    // Chaves Estrangeiras
    id_hospital: { type: Number, required: true, index: true },
    nome_hospital: { type: String, required: true, trim: true },
    cod_servico: { type: Number, required: true },
    especialidade: { type: String, required: true, index: true, trim: true },

    // Dimensão Tempo
    ano: { type: Number, required: true },
    mes: { type: String, required: true, trim: true },
    trimestre: { type: Number, min: 1, max: 4 },
    semana: { type: Number },
    dia: { type: Number },
    data_completa: { type: Date, required: true, index: true },

    // Classificações
    populacao_alvo: { 
        type: String, 
        enum: ['Adulto', 'Criança'], 
        default: 'Adulto',
        index: true 
    },
    tipo_lista: { 
        type: String, 
        enum: ['Geral', 'Não Oncológica', 'Oncológica'],
        required: true,
        index: true
    },

    // Métricas (KPIs) - Adicionado min: 0 para segurança
    num_utentes: { type: Number, default: 0, min: 0 },
    
    // Estrutura Aninhada (Coerente com o XML)
    tempo_medio_espera: {
        normal: { type: Number, default: 0, min: 0 },
        prioritario: { type: Number, default: 0, min: 0 },
        muito_prioritario: { type: Number, default: 0, min: 0 },
        global: { type: Number, required: true, min: 0 }
    }

}, {
    collection: 'Consultas',
    toJSON: { virtuals: true }, // Importante para o Frontend ver o status
    toObject: { virtuals: true }
});

// --- INTELIGÊNCIA VIRTUAL (NOVIDADE) ---
// Calcula automaticamente se o acesso à consulta está crítico
consultaSchema.virtual('status_acesso').get(function() {
    // Regra de Negócio: Oncologia acima de 5 dias é mau, Geral acima de 120 dias é mau
    if (this.tipo_lista === 'Oncológica' && this.tempo_medio_espera.global > 5) return 'Crítico';
    if (this.tempo_medio_espera.global > 150) return 'Muito Atrasado';
    if (this.tempo_medio_espera.global > 90) return 'Atrasado';
    return 'Normal';
});

// Índice para Comparação (Q4: Oncologia vs Geral)
consultaSchema.index({ id_hospital: 1, tipo_lista: 1, especialidade: 1 });

module.exports = mongoose.model('Consulta', consultaSchema);