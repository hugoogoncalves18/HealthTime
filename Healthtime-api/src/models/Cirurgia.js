const mongoose = require('mongoose');

const cirurgiaSchema = new mongoose.Schema({
    id_hospital: { type: Number, required: true, index: true },
    nome_hospital: { type: String, required: true, trim: true },
    cod_servico: { type: Number, required: true, index: true }, // PK/FK importante
    especialidade: { type: String, required: true, index: true, trim: true },

    // Dimensão Tempo
    ano: { type: Number, required: true },
    mes: { type: String, required: true, trim: true },
    trimestre: { type: Number },
    data_completa: { type: Date, required: true, index: true },

    // Classificações
    tipo_lista: { 
        type: String, 
        enum: ['Geral', 'Não Oncológica', 'Oncológica'],
        required: true,
        index: true
    },
    
    // Métricas
    num_utentes_inscritos: { type: Number, default: 0, min: 0 },
    tempo_medio_espera_dias: { type: Number, required: true, min: 0 },
    
    descricao_prioridade: { type: String, trim: true } 

}, {
    collection: 'Cirurgias',
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// --- INTELIGÊNCIA VIRTUAL ---
// O Frontend recebe isto sem tu teres de calcular
cirurgiaSchema.virtual('status_gravidade').get(function() {
    if (this.tipo_lista === 'Oncológica' && this.tempo_medio_espera_dias > 15) return 'Crítico';
    if (this.tempo_medio_espera_dias > 180) return 'Muito Atrasado';
    if (this.tempo_medio_espera_dias > 90) return 'Atrasado';
    return 'Normal';
});

// Índice Composto (Performance Q6 e Dashboards)
cirurgiaSchema.index({ id_hospital: 1, especialidade: 1, data_completa: -1 });

module.exports = mongoose.model('Cirurgia', cirurgiaSchema);