const mongoose = require('mongoose');

// Sub-schema (Reutilizável para as 5 cores)
// _id: false poupa recursos, pois não precisamos de ID para cada cor individual
const dadosCorSchema = new mongoose.Schema({
    tempo_medio: { type: Number, default: 0, min: 0 }, 
    num_utentes: { type: Number, default: 0, min: 0 }  
}, { _id: false });

const urgenciaSchema = new mongoose.Schema({
    id_hospital: { type: Number, required: true, index: true },
    nome_hospital: { type: String, required: true, trim: true },
    data_registo: { type: Date, required: true, index: true },
    data_submissao: { type: Date, default: Date.now },
    
    tipologia: { type: String, required: true, index: true, trim: true },
    estado_urgencia: { 
        type: String, 
        enum: ['Aberta', 'Fechada', 'Condicionada'], 
        required: true 
    },

    // Estrutura de Cores
    // default: () => ({}) garante que o objeto existe mesmo que venha vazio do XML
    triagem: {
        vermelho: { type: dadosCorSchema, default: () => ({}) },
        laranja: { type: dadosCorSchema, default: () => ({}) },
        amarelo: { type: dadosCorSchema, default: () => ({}) },
        verde: { type: dadosCorSchema, default: () => ({}) },
        azul: { type: dadosCorSchema, default: () => ({}) }
    }
}, {
    timestamps: true,
    collection: 'Urgencias',
    toJSON: { virtuals: true }, // IMPORTANTE: Expõe os cálculos no JSON final
    toObject: { virtuals: true }
});

// --- INTELIGÊNCIA EXTRA (VIRTUALS) ---

// 1. Total de Utentes (Calculado na hora, sem ocupar espaço na BD)
urgenciaSchema.virtual('total_utentes_espera').get(function() {
    return (this.triagem.vermelho?.num_utentes || 0) +
           (this.triagem.laranja?.num_utentes || 0) +
           (this.triagem.amarelo?.num_utentes || 0) +
           (this.triagem.verde?.num_utentes || 0) +
           (this.triagem.azul?.num_utentes || 0);
});

// 2. Nível de Pressão (KPI Proativo para o Dashboard)
urgenciaSchema.virtual('nivel_pressao').get(function() {
    const total = this.total_utentes_espera; // Usa o virtual de cima
    
    if (this.estado_urgencia === 'Fechada') return 'Fechado';
    if (this.estado_urgencia === 'Condicionada') return 'Condicionada';
    
    // Regras de negócio para alertas automáticos
    if (total > 50) return 'Crítico';
    if (total > 20) return 'Elevado';
    return 'Normal';
});

// Índices Compostos (Performance Máxima)
urgenciaSchema.index({ id_hospital: 1, data_registo: -1 });
urgenciaSchema.index({ "triagem.vermelho.num_utentes": -1 }); // Para detetar emergências graves rapidamente

module.exports = mongoose.model('Urgencia', urgenciaSchema);