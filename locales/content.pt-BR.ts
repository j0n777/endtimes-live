/**
 * Conteúdo longo em Português do Brasil.
 * Survival Guides + Prophecy descriptions.
 */

import { SurvivalGuide } from '../types';

export const SURVIVAL_GUIDES_PT: SurvivalGuide[] = [
  {
    id: 's1',
    title: 'Protocolos de Água',
    category: 'WATER',
    content: `### PRIORIDADE CRÍTICA
A água é a prioridade absoluta. Você pode sobreviver 3 semanas sem comida, mas apenas 3 dias sem água.

### 1. Necessidades
- **Consumo**: 2-3 litros por pessoa/dia.
- **Higiene**: 2-4 litros por pessoa/dia.
- **Estoque Mínimo**: 2 semanas (aprox. 60L por pessoa).

### 2. Métodos de Purificação
**Fervura (Nível 1)**: Ferver em ebulição por 1 min (3 min em altitude elevada). Elimina bactérias, vírus e parasitas.
**Química (Nível 2)**: Água sanitária sem perfume (5-9%). 8 gotas por litro de água limpa, 16 gotas se turva. Aguardar 30 min.
**Filtração (Nível 3)**: Filtros mecânicos (0,1 micron). Remove bactérias/protozoários, mas NÃO vírus.

### 3. Fontes
- Captação de água da chuva (requer pré-filtração).
- Nascentes naturais (ferva antes).
- Reservatório do aquecedor de água (desligue o gás/energia primeiro!).
- Caixa de descarga do vaso sanitário (NÃO a tigela, e só se não houver pastilhas químicas).`,
    checklist: [
      { id: 'w1', text: 'Calcule o consumo diário da família', completed: false },
      { id: 'w2', text: 'Adquira filtro principal (Sawyer/LifeStraw ou similar)', completed: false },
      { id: 'w3', text: 'Armazene 14 dias de água em local fresco e escuro', completed: false },
      { id: 'w4', text: 'Adquira comprimidos de purificação de reserva', completed: false }
    ]
  },
  {
    id: 's2',
    title: 'Estoque de Alimentos',
    category: 'FOOD',
    content: `### ESTRATÉGIA: "Despensa Profunda"
Não compre "comida de sobrevivência" que você não come. Coma o que estoca, estoque o que come.

### 1. Os Básicos (Longo Prazo)
- **Arroz Branco**: 30+ anos em sacos Mylar com absorvedores de O2.
- **Feijão Seco**: 30+ anos. Proteína completa quando combinado com arroz.
- **Mel/Açúcar/Sal**: Prazo de validade indeterminado.
- **Macarrão**: 20+ anos.
- **Conservas (Latas)**: 2-5 anos.

### 2. Equilíbrio Nutricional
Foque em alta densidade calórica. O estresse queima mais calorias.
- Óleos (Azeite, Coco) para gorduras.
- Multivitamínicos para prevenir carências e escorbuto.

### 3. Cozinhar Sem Energia Elétrica
- Fogão camping a gás (armazene o botijão em segurança).
- Fogareiro foguete (queima gravetos/detritos).
- Forno solar (discreto, sem fumaça).`,
    checklist: [
      { id: 'f1', text: 'Calcule a necessidade de 2000 kcal/pessoa/dia', completed: false },
      { id: 'f2', text: 'Compre 10kg de arroz + galão/balde', completed: false },
      { id: 'f3', text: 'Estoque 2 semanas de carne enlatada', completed: false },
      { id: 'f4', text: 'Garanta um abridor de latas manual', completed: false }
    ]
  },
  {
    id: 's3',
    title: 'Mochila de Fuga (72h)',
    category: 'SECURITY',
    content: `### CONCEITO
Um kit para mantê-lo vivo enquanto se desloca do ponto A ao ponto B. Peso máximo: 20% do peso corporal.

### OS 5 C's DA SOBREVIVÊNCIA
1. **Corte (Cutting)**: Faca de lâmina fixa + multitool.
2. **Combustão**: Pedernal, 2 isqueiros Bic, fósforos à prova d'água.
3. **Cobertura (Cover)**: Lona, cobertor de lã ou saco bivak.
4. **Contentor (Container)**: Garrafa de aço inoxidável de parede simples (pode ferver água diretamente).
5. **Cordame (Cordage)**: 30m de paracord (carga de 250kg).

### Itens Adicionais Essenciais
- Mapa & Bússola (área local).
- Kit de Primeiros Socorros (foco em trauma).
- Lanterna de cabeça + pilhas reserva.
- Dinheiro em espécie (notas pequenas).
- Cópias de Documentos (lacradas em saco plástico).`,
    checklist: [
      { id: 'b1', text: 'Adquira uma mochila robusta e discreta', completed: false },
      { id: 'b2', text: 'Monte os 5 C\'s', completed: false },
      { id: 'b3', text: 'Inclua 3 dias de alimentos leves/liofilizados', completed: false },
      { id: 'b4', text: 'Digitalize e criptografe documentos em pen drive', completed: false }
    ]
  },
  {
    id: 's4',
    title: 'Plano de Comunicação',
    category: 'COMMS',
    content: `### Plano PACE
**P**rimário: Celular (enquanto a rede estiver no ar).
**A**lternativo: Internet/Apps (Signal, Briar para malha).
**C**ontingência: Rádio UHF/VHF (comunicação local).
**E**mergência: Rádio HF (longa distância, notícias).

### Monitoramento
- Ouça mais do que transmite.
- Mantenha os rádios carregados (energia solar).
- Conheça as suas frequências (veja o Painel de Rádio).

### Sinais
- Apito: 3 apitos = Pedido de socorro.
- Visual: Espelho de sinalização, painel VS-17.`,
    checklist: [
      { id: 'c1', text: 'Combine um ponto de encontro familiar', completed: false },
      { id: 'c2', text: 'Adquira um rádio Baofeng UV-5R ou similar', completed: false },
      { id: 'c3', text: 'Programe as frequências de repetidoras locais', completed: false },
      { id: 'c4', text: 'Imprima lista de contatos (cópia física)', completed: false }
    ]
  },
];

/** Tradução das descrições de profecias (IDs correspondem a prophecyData.ts) */
export const PROPHECY_DESCRIPTIONS_PT: Record<string, { title: string; description: string }> = {
  // Biblical — cumpridas
  p_israel_rebirth:   { title: 'Renascimento de Israel', description: 'Israel restabelecido como nação em 1948, cumprindo Isaías 66:8.' },
  p_jerusalem:        { title: 'Jerusalém Retomada', description: 'Jerusalém sob controle judaico desde 1967 (Lucas 21:24).' },
  p_knowledge:        { title: 'Aumento do Conhecimento', description: 'Explosão tecnológica e de viagens no último século (Daniel 12:4).' },
  // Em andamento
  p_gospel:           { title: 'Evangelho a Todas as Nações', description: 'A internet global e a tradução estão acelerando o alcance (Mateus 24:14).' },
  p_wars:             { title: 'Guerras e Rumores de Guerras', description: 'Tensão geopolítica global crescente (Mateus 24:6).' },
  p_apostasy:         { title: 'Apostasia', description: 'Afastamento da fé nas igrejas institucionais (2 Tessalonicenses 2:3).' },
  p_mark:             { title: 'Marca Digital / Controle', description: 'Avanço para sociedade sem dinheiro físico e ID biométrico (Apocalipse 13:16-17).' },
  p_pestilence:       { title: 'Pestilências', description: 'Pandemias e doenças emergentes aumentando em frequência (Lucas 21:11).' },
  // Pendentes
  p_third_temple:     { title: 'Terceiro Templo', description: 'Preparações (Vaca Ruiva, planos) concluídas. Templo ainda não construído (2 Tessalonicenses 2:4).' },
  p_gog_magog:        { title: 'Gog e Magog', description: 'Coalizão de nações (Norte) atacando Israel (Ezequiel 38).' },
  p_antichrist:       { title: 'O Anticristo', description: 'Líder mundial surgindo do caos, exigindo adoração (Apocalipse 13).' },
  p_one_world:        { title: 'Governo Mundial Único', description: 'Consolidação do poder global sob uma única autoridade (Apocalipse 17).' },
  p_euphrates:        { title: 'Eufrates Secando', description: 'O grande rio está secando, preparando o caminho para o Oriente (Apocalipse 16:12).' },
  // Islamic (Hadith)
  i_dajjal:           { title: 'Al-Dajjal (O Falso Messias)', description: 'Um líder enganoso surgindo nos tempos finais, citado em numerosos hadiths.' },
  i_mahdi:            { title: 'O Mahdi', description: 'Líder redentor islâmico que aparecerá antes do Dia do Juízo.' },
  i_isa:              { title: 'Retorno de Isa (Jesus)', description: 'Jesus retornando para derrotar o Dajjal — mencionado em hadiths de Buhkari/Muslim.' },
  i_yajuj:            { title: 'Yajuj e Majuj (Gog e Magog)', description: 'Nações destruidoras liberadas antes da Hora Final (Alcorão 21:96).' },
};
