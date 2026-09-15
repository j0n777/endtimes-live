/**
 * Conteúdo longo em Português do Brasil.
 * Survival Guides + Prophecy descriptions.
 */

import { SurvivalGuide } from '../types';

export const SURVIVAL_GUIDES_PT: SurvivalGuide[] = [
  {
    id: 's1',
    title: 'Protocolos de Água (Scarcity Edition)',
    category: 'WATER',
    content: `### PRIORIDADE 0: HIDRATAÇÃO EM COLAPSO
Sem água, a morte ocorre em 72 horas. Em um cenário de escassez, a água potável é a sua moeda mais valiosa.

### 1. Captação Urbana e Rural (Scavenging)
- **Cisternas Subterrâneas**: Edifícios comerciais e condomínios mantêm tanques limpos por dias após o corte. Use uma bomba manual ou balde com corda.
- **Ar Condicionado**: A água de condensação é destilada. Não tem minerais, mas está livre de bactérias. Colete e adicione uma pitada de sal.
- **Água da Chuva**: Utilize lonas de polietileno. **AVISO**: As primeiras 10 polegadas de chuva limpam o ar de poluentes; descarte os primeiros 20 litros.

### 2. Filtro de Bio-Areia DIY (Construção)
Se filtros comerciais (Sawyer/Lifestraw) falharem, construa este sistema:
- **Corpo**: Balde de 20L ou PVC de 150mm.
- **Base (5cm)**: Pedras grandes para fluxo.
- **Meio (10cm)**: Carvão ativado (queime madeira e esmague). **ESSENCIAL**: Remove toxinas químicas.
- **Topo (15cm)**: Areia fina lavada. 
- **O Segredo**: Deixe 5cm de água sobre a areia. Em 2 semanas, cria-se a *Schmutzdecke* (camada biológica) que consome bactérias ativamente.

### 3. Desinfecção Final
Filtros DIY não matam vírus. Use:
- **Fervura**: 1 min em ebulição forte.
- **SODIS**: Garrafas PET transparentes ao sol por 6h (raios UV matam patógenos).
- **Cloro**: 2 gotas de água sanitária (sem perfume) por litro. Aguarde 30 min.`,
    checklist: [
      { id: 'w1', text: 'Localize fontes de água alternativas (cisternas, poços)', completed: false },
      { id: 'w2', text: 'Construa um protótipo de filtro de bio-areia', completed: false },
      { id: 'w3', text: 'Estoque 20L de água sanitária (limpeza e purificação)', completed: false },
      { id: 'w4', text: 'Aprenda a identificar plantas indicadoras de água (Salgueiros, Juncos)', completed: false }
    ]
  },
  {
    id: 's2',
    title: 'Estoque de Alimentos (Resiliência Máxima)',
    category: 'FOOD',
    content: `### ESTRATÉGIA: "Despensa Profunda e Viva"
A comida acaba. O conhecimento de preservação de calorias é eterno.

### 1. O Método do "Balde de 20L"
Para armazenamento de 25+ anos, use:
- **Sacos Mylar**: 7 mil de espessura.
- **Absorvedores de O2**: 2000cc por balde.
- **Itens**: Arroz branco, feijão, aveia, açúcar, sal.
- **Selagem**: Use uma chapinha de cabelo ou ferro de passar para selar o saco Mylar.

### 2. Calorias vs Nutrição
O estresse em combate/fuga queima 3000-4000 kcal/dia.
- **Gorduras**: O item mais difícil de estocar (ranço). Foque em Ghee (manteiga clarificada) e Óleo de Coco.
- **Proteína**: Carne enlatada (Spam, Atum) e ovos em conserva (água de cal).
- **Vitaminas**: Brotos de feijão (Sprouting) fornecem Vitamina C fresca em 3 dias sem solo.

### 3. Cozinhar no Escuro (Stealth Cooking)
Evite fumaça para não revelar sua posição.
- **Forno Solar**: Silencioso, sem cheiro.
- **Manta Térmica**: Ferva a comida e coloque na caixa isolada (Haybox) para terminar de cozinhar sem gastar combustível.`,
    checklist: [
      { id: 'f1', text: 'Monte 3 meses de rotação (FIFO - First In, First Out)', completed: false },
      { id: 'f2', text: 'Aprenda a fazer Ghee para estocar gordura', completed: false },
      { id: 'f3', text: 'Adquira 10 sacos Mylar e 50 absorvedores de O2', completed: false },
      { id: 'f4', text: 'Estoque 5kg de sal (essencial para preservação de carnes)', completed: false }
    ]
  },
  {
    id: 's3',
    title: 'Kit de Fuga e Teoria "Grey Man"',
    category: 'SECURITY',
    content: `### O CONCEITO DE MOBILIDADE E INVISIBILIDADE
Seu kit deve ser discreto. Uma mochila tática cheia de "molle" é um alvo para confisco pela polícia ou saqueadores.

### 1. A Mochila (Níveis de Defesa)
- **Nível 1 (Bolsos)**: Isqueiro, canivete, lanterna pequena, dinheiro. Se perder a mochila, você sobrevive.
- **Nível 2 (Mochila)**: Os 5 C's de sobrevivência (Corte, Combustão, Cobertura, Contentor, Cordame).
- **Nível 3 (Área de Fuga)**: Ferramentas de construção e sementes.

### 2. O Estilo "Grey Man" (Homem Cinza)
- **Vestimenta**: Roupas comuns, cores neutras (azul marinho, cinza, marrom). Sem logos.
- **Comportamento**: Mova-se com propósito, mas sem pressa. Não faça contato visual prolongado.
- **Equipamento**: Cubra itens brilhantes com fita isolante fosca.

### 3. Sourcing de Itens na Fuga
- **Mangueira de Aquário**: Para retirar gasolina de veículos abandonados (Siphoning).
- **Ímã de micro-ondas**: Para criar bússolas improvisadas.
- **Vidro quebrado**: Excelente raspador para madeira e isca de fogo.`,
    checklist: [
      { id: 'b1', text: 'Reduza o peso da mochila para 15% do seu peso corporal', completed: false },
      { id: 'b2', text: 'Teste o kit em uma caminhada de 10km no escuro', completed: false },
      { id: 'b3', text: 'Adquira um filtro de água portátil (Sawyer Squeeze)', completed: false },
      { id: 'b4', text: 'Criptografe documentos em um SD card escondido no cinto', completed: false }
    ]
  },
  {
    id: 's4',
    title: 'Comunicações e Sinais (Low-Tech)',
    category: 'COMMS',
    content: `### COMUNICAÇÃO QUANDO A REDE CAI
Informação é poder. O silêncio é segurança.

### 1. Sinais Visuais (Scarcity)
- **Espelho de Sinalização**: Pode ser visto a 30km. Use até um CD velho ou a tela do celular desligada.
- **Marcas de "Hobo"**: Combine símbolos com seu grupo (Ex: traço na parede = "Área Segura").
- **VS-17 Improvisado**: Um pano laranja ou rosa neon para sinalização aérea.

### 2. Rádio e Inteligência de Sinais (SIGINT)
- **Monitoramento**: Nunca transmita sem extrema necessidade. Use antenas "Yagi" DIY (feitas com cabides) para focar sinal e não ser triangulado.
- **Código de Grupo**: Use "One-time pad" (livro de códigos) para comunicações seguras que nem o governo consegue quebrar sem a chave física.

### 3. Dead Drops (Caixas Mortas)
Esconda mensagens físicas em frestas de muros ou ocos de árvores. Evite comunicação direta que exponha ambos os membros.`,
    checklist: [
      { id: 'c1', text: 'Crie um livro de códigos One-time pad com sua família', completed: false },
      { id: 'c2', text: 'Aprenda a construir uma antena J-Pole de fita métrica', completed: false },
      { id: 'c3', text: 'Pratique o código Morse (pelo menos o SOS)', completed: false },
      { id: 'c4', text: 'Tenha um rádio AM/FM de manivela/solar', completed: false }
    ]
  },
  {
    id: 's5',
    title: 'Filtração Bio-Areia (Avançado)',
    category: 'WATER',
    content: `### SISTEMA SEMI-PERMANENTE DE FILTRAÇÃO
Para uma base estável, você precisa de volumes maiores de água.

### 1. Construção do Contêiner
Use um tambor azul de 200L.
- **Fundo**: Camada de dreno com tubos de PVC furados para saída da água.
- **Mídia**: 40cm de areia de sílica fina (0.1 a 0.3mm).
- **Difusor**: Uma placa furada no topo para a água não "furar" a areia ao ser despejada.

### 2. A Camada Biológica (Schmutzdecke)
Esta camada é um ecossistema de protozoários e bactérias "boas" que atacam patógenos.
- **Manutenção**: Nunca deixe a areia secar. A vida biológica precisa de umidade.
- **Limpeza**: A cada 6 meses, raspe os primeiros 2cm de areia ("Scraping") e substitua.

### 3. Teste Improvisado de Potabilidade
Na ausência de laboratório, use o "Teste da Transparência": se você consegue ler um jornal através de 30cm de água em um balde branco, ela está fisicamente limpa, mas ainda requer fervura.`,
    checklist: [
      { id: 'w5', text: 'Adquira tambor de 200L de grau alimentício', completed: false },
      { id: 'w6', text: 'Lave 100kg de areia fina até que a água saia límpida', completed: false },
      { id: 'w7', text: 'Instale torneira de saída com vedação de borracha', completed: false },
      { id: 'w8', text: 'Mantenha o sistema rodando por 2 semanas para maturação', completed: false }
    ]
  },
  {
    id: 's6',
    title: 'Protocolos de Fogo (Extremo)',
    category: 'SKILLS',
    content: `### CALOR E SINALIZAÇÃO SEM RECURSOS
Em 0°C, a hipotermia mata em poucas horas. O fogo é vida.

### 1. Ignição em Condições Adversas
- **Pilha e Bombril**: Toque os terminais de uma pilha 9V (ou 2 AA) na palha de aço. Reação instantânea.
- **Fricção (Hand Drill)**: Requer madeira extremamente seca (Yucca, Cedro). Exige calos nas mãos e paciência.
- **Pedernal Scavenging**: Use uma faca de aço carbono contra uma pedra de quartzo ou sílex para gerar faíscas.

### 2. Estrutura de Fogo Invisível (Dakota Fire Pit)
Esconda sua luz e fumaça:
- Cavar dois buracos conectados por um túnel subterrâneo.
- O fogo queima em um buraco enquanto o outro fornece oxigênio constante.
- **Vantagem**: Quase não produz fumaça e a luz não é visível à distância.

### 3. Isca de Emergência (Char Cloth)
Transforme restos de camiseta de algodão em carvão de pano (Char Cloth). Ele captura a menor faísca e se transforma em brasa imediata.`,
    checklist: [
      { id: 'sk1', text: 'Pratique o Dakota Fire Pit no seu quintal', completed: false },
      { id: 'sk2', text: 'Faça um lote de Char Cloth usando uma lata de metal', completed: false },
      { id: 'sk3', text: 'Aprenda a identificar resina de pinheiro (acelerante natural)', completed: false },
      { id: 'sk4', text: 'Domine a ignição com lente de óculos/presbiopia', completed: false }
    ]
  },
  {
    id: 's7',
    title: 'Abrigo de Detritos e Térmico',
    category: 'SKILLS',
    content: `### ENGENHARIA DE ABRIGO EM ESCASSEZ
A meta é 37°C. O abrigo deve ser pequeno para manter o calor corporal.

### 1. O Abrigo de Detritos (A-Frame)
- **Espinha**: Um tronco forte apoiado em um V ou galho de árvore.
- **Costelas**: Galhos apoiados na espinha.
- **Isolamento**: 60cm a 1 metro de folhas secas, musgo ou grama sobre as costelas. **AVISO**: Se a camada for fina, você vai se molhar e morrer de frio.

### 2. O Leito Térmico (Vital)
NUNCA durma diretamente no chão. O solo suga seu calor.
- Construa uma "cama" de 20cm de altura feita de folhas amassadas ou galhos de pinheiro.

### 3. Abrigo Urbano
- **Papelão**: Melhor isolante térmico urbano. Use várias camadas.
- **Plástico Bolha**: Retém bolsas de ar estático. Envolva-se nele dentro de um saco de lixo grande.`,
    checklist: [
      { id: 'sk5', text: 'Adolere 30m de Paracord (cordame essencial)', completed: false },
      { id: 'sk6', text: 'Pratique a construção de um Lean-to em 15 minutos', completed: false },
      { id: 'sk7', text: 'Aprenda a identificar a entrada do vento dominante', completed: false },
      { id: 'sk8', text: 'Identifique riscos (Widowmakers - galhos podres acima)', completed: false }
    ]
  },
  {
    id: 's8',
    title: 'Bio-Combustível e Energia DIY',
    category: 'ENERGY',
    content: `### INDEPENDÊNCIA ENERGÉTICA NO CAOS
Motores diesel antigos (mecânicos) podem rodar com quase qualquer óleo.

### 1. Produção de Biodiesel (Scarcity Step)
- **Ingredientes**: Óleo de cozinha usado, Metanol (pode ser álcool de posto 99% se purificado) e Soda Cáustica.
- **A Química**: A transesterificação remove a glicerina que entope os bicos injetores.
- **Purificação**: Sem aparelhos modernos, use o "Sedimentador Solar": deixe a mistura em garrafas PET ao sol por 48h. A glicerina desce, o combustível sobe.

### 2. Gasogênio (Wood Gas)
Converta madeira em gás para rodar motores a gasolina.
- Requer dois baldes de metal selados e tubulação de cobre.
- A madeira queima sem oxigênio, liberando CO e H (gás de síntese).

### 3. Baterias Viciadas
Recupere baterias de chumbo-ácido de carros velhos usando sal de Epsom (Sulfato de Magnésio) e água destilada.`,
    checklist: [
      { id: 'e1', text: 'Estoque 5kg de Soda Cáustica e 20L de Álcool 99%', completed: false },
      { id: 'e2', text: 'Construa um mini-destilador solar para água e combustíveis', completed: false },
      { id: 'e3', text: 'Aprenda a mecânica básica de um gerador a diesel', completed: false },
      { id: 'e4', text: 'Identifique veículos sem eletrônica (pré-1998)', completed: false }
    ]
  },
  {
    id: 's9',
    title: 'Saneamento e Bio-Riscos',
    category: 'SKILLS',
    content: `### A GUERRA CONTRA A DISENTERIA
Em desastres, a falta de higiene mata mais que a fome. O esgoto para de fluir; você precisa de um plano.

### 1. O Sistema de "Dois Baldes" (Estratégico)
Separação é a chave para evitar o cheiro e a propagação de doenças.
- **Balde 1 (Líquidos)**: Apenas urina. Pode ser descartada em solo absorvente longe de fontes de água.
- **Balde 2 (Sólidos)**: Use um saco reforçado. Após cada uso, cubra com serragem, cinzas de fogueira ou cal. Isso seca as fezes e impede que moscas (vetores) posem e levem doenças para sua comida.

### 2. Higiene de "Escassez"
- **Banho de Esponja**: Use apenas 500ml de água. Foque nas axilas, virilha e pés.
- **Lava-Rápido de Mãos**: Pendure uma garrafa PET furada com um prego (torneira improvisada). Use sabão de coco (mais versátil).

### 3. Gerenciamento de Resíduos
- **Incinerador DIY**: Use um latão de 200L com furos laterais para alta temperatura. Queime apenas o que for combustível biológico perigoso.`,
    checklist: [
      { id: 'sk9', text: 'Adquira 2 baldes de 20L e assentos adaptáveis', completed: false },
      { id: 'sk10', text: 'Estoque 10kg de cal ou 2 sacos de serragem seca', completed: false },
      { id: 'sk11', text: 'Aprenda a fazer sabão de cinzas (potassa)', completed: false },
      { id: 'sk12', text: 'Identifique uma zona de descarte a 50m de qualquer água', completed: false }
    ]
  },
  {
    id: 's10',
    title: 'Trauma e Medicina de Combate',
    category: 'MEDICAL',
    content: `### MEDICINA QUANDO O 192 NÃO VEM
Foco absoluto em "Stop the Bleed" (Parar o Sangramento).

### 1. Hemorragias Massivas
- **Torniquete**: Se o sangue for vermelho vivo e pulsar, use o torniquete. **REGRA**: "High and Tight" (Alto e Apertado) no membro ferido. Anote a hora.
- **Preenchimento de Ferida**: Em áreas onde o torniquete não alcança (axila, virilha), enfie gaze estéril ou um pano limpo o mais fundo possível e aplique pressão constante por 10 minutos.

### 2. Infecções em Cenário de Escassez
Sem antibióticos, qualquer corte é perigoso. 
- **Mel de Abelha**: Mel puro (não processado) é um antibacteriano potente para curativos.
- **Irrigação**: Lave feridas com água potável sob pressão (seringa ou garrafa furada).

### 3. Erros Fatais
- Nunca tente remover objetos empalados (facas, estilhaços) fora de um hospital.`,
    checklist: [
      { id: 'm1', text: 'Tenha 1 torniquete CAT Gen7 original por pessoa', completed: false },
      { id: 'm2', text: 'Monte um IFAK (Individual First Aid Kit) tático', completed: false },
      { id: 'm3', text: 'Estoque 1 litro de Iodo e 500g de Mel puro', completed: false },
      { id: 'm4', text: 'Pratique a manobra de Heimlich e RCP', completed: false }
    ]
  },
  {
    id: 's11',
    title: 'Preservação de Alimentos (Sem Luz)',
    category: 'FOOD',
    content: `### DOMINANDO O TEMPO E A DECOMPOSIÇÃO
Saber conservar é tão importante quanto saber produzir.

### 1. Salga (Curing)
O sal remove a umidade onde as bactérias crescem.
- **Carne de Sol/Charque**: Cubra a carne com sal grosso, deixe drenar por 24h e pendure em local ventilado e protegido de insetos.
- **Peixe**: A técnica de salga seca garante proteína por meses.

### 2. Desidratação Solar
Construa uma caixa de madeira com fundo preto e tampa de vidro/plástico.
- Corte frutas e vegetais em fatias finas.
- A ventilação é crucial (furos no topo e base para efeito chaminé).

### 3. Fermentação (Conservas Vivas)
- **Chucrute (Couve/Repolho)**: Apenas repolho picado, sal e tempo. Gera probióticos vitais para a imunidade em tempos de estresse.`,
    checklist: [
      { id: 'f5', text: 'Estoque 20kg de sal grosso (não iodado se possível)', completed: false },
      { id: 'f6', text: 'Construa um desidratador solar de teste', completed: false },
      { id: 'f7', text: 'Pratique a técnica de "Canning" (Conservas em vidro)', completed: false },
      { id: 'f8', text: 'Aprenda a identificar carnes estragadas (botulismo)', completed: false }
    ]
  },
  {
    id: 's12',
    title: 'Fortificação Residencial',
    category: 'SECURITY',
    content: `### TRANSFORMANDO SUA CASA EM UMA FORTALEZA
A maioria das casas brasileiras é vulnerável a invasões simples.

### 1. Camadas de Proteção
- **Camada 1 (Exterior)**: Iluminação por sensores. **DICA**: Arame farpado escondido em cercas vivas de Bougainvillea (Primavera).
- **Camada 2 (Pontos de Entrada)**: Troque os parafusos das dobradiças e trincas por parafusos de 10cm que alcancem o barrote da parede.
- **Camada 3 (Janelas)**: Aplique película de segurança (Security Film) que impede que o vidro estilhace com uma marretada.

### 2. Alarme "Low-Tech"
- **Latas de Alumínio**: Uma linha de pesca com latas contendo pedrinhas é o melhor alarme perimetral silencioso (para você) e barulhento (para o intruso).

### 3. Opacidade de Inteligência
Não deixe ninguém saber o que você tem. Não ligue geradores barulhentos à noite se seus vizinhos estão no escuro.`,
    checklist: [
      { id: 'sec1', text: 'Substitua parafusos curtos de todas as portas externas', completed: false },
      { id: 'sec2', text: 'Instale calços de madeira nos trilhos de janelas', completed: false },
      { id: 'sec3', text: 'Crie um "Panic Room" ou área de retirada segura', completed: false },
      { id: 'sec4', text: 'Remova arbustos que sirvam de esconderijo perto da porta', completed: false }
    ]
  },
  {
    id: 's13',
    title: 'Gaiola de Faraday DIY',
    category: 'ENERGY',
    content: `### PROTEÇÃO CONTRA EMP (PULSO ELETROMAGNÉTICO)
Um evento solar ou nuclear pode fritar todos os eletrônicos modernos.

### 1. O Que Proteger?
- Rádio comunicadores (Baofeng, etc).
- Lanternas LED (os circuitos internos são sensíveis).
- Pen drives com documentos digitais.
- Tablets com manuais de sobrevivência offline.

### 2. Como Construir
Use um latão de lixo de metal com tampa hermética.
- **Isolamento Interno**: Forre todo o interior com papelão ou madeira. **REGRA**: O eletrônico não pode tocar no metal.
- **Vedação**: A tampa deve ter contato metal-metal em 360°. Use fita de alumínio se necessário.

### 3. O Teste do Celular
Coloque um celular ligado dentro da gaiola e feche. Tente ligar para ele. Se a chamada cair direto na caixa postal, sua blindagem está funcionando.`,
    checklist: [
      { id: 'e5', text: 'Adquira 1 lata de metal (lixo ou munição)', completed: false },
      { id: 'e6', text: 'Forre o interior com papelão grosso', completed: false },
      { id: 'e7', text: 'Coloque rádios reserva e baterias dentro', completed: false },
      { id: 'e8', text: 'Realize o teste de recepção de sinal', completed: false }
    ]
  },
  {
    id: 's14',
    title: 'Energia Solar (Sistema Crítico)',
    category: 'ENERGY',
    content: `### MANUTENÇÃO DE CARGA EM OFF-GRID
Luz e rádio são cruciais para a moral e inteligência.

### 1. Sizing Minimalista
Não tente alimentar uma geladeira. Foque no essencial:
- **Painel 100W**: Suficiente para carregar baterias e luzes.
- **Controlador de Carga**: Protege a bateria de sobrecarga.
- **Bateria Estacionária**: Armazena a energia para a noite.

### 2. Baterias Viciadas (Recuperação)
Se encontrar baterias de carro velhas:
- Limpe os terminais.
- Substitua o eletrólito por uma solução de Água Destilada e Sal de Epsom (Sulfato de Magnésio). Isso pode dar mais alguns meses de vida à bateria.

### 3. Luz Noturna
Use fitas de LED 12V diretamente na bateria. São muito mais eficientes que lâmpadas 110/220V via inversor.`,
    checklist: [
      { id: 'e9', text: 'Adquira um painel solar flexível de 50W ou 100W', completed: false },
      { id: 'e10', text: 'Tenha 1 par de conectores MC4 de reserva', completed: false },
      { id: 'e11', text: 'Aprenda a usar um Multímetro para testar polaridade', completed: false },
      { id: 'e12', text: 'Estoque lâmpadas de LED 12V (automotivas servem)', completed: false }
    ]
  },
  {
    id: 's15',
    title: 'Economia de Barter (Troca)',
    category: 'SECURITY',
    content: `### ATIVOS DE TROCA QUANDO O DINHEIRO ACABA
Ouro e Prata são bons, mas itens de utilidade imediata valem mais em crises.

### 1. Metais Preciosos Fracionados
- **Prata**: Ideal para compras pequenas (pão, ovos). Moedas antigas de prata são reconhecidas mundialmente.
- **Ouro**: Para grandes evacuações ou subornos críticos.

### 2. Ativos de Alta Demanda
Tenha estoques extras de:
- **Vícios**: Café, Cigarros, Sal, Mel.
- **Utilidades**: Isqueiros BIC, Agulhas/Linhas, Pilhas AA.
- **Antibióticos e Analgésicos**: Se tornam as moedas mais raras.

### 3. OpSec em Trocas
Nunca mostre todo o seu estoque. Faça trocas em locais neutros. Mostrar que você tem muito café pode motivar um ataque ao seu estoque.`,
    checklist: [
      { id: 'sec5', text: 'Separe 10 isqueiros extras e 2kg de café selado', completed: false },
      { id: 'sec6', text: 'Adquira 10 moedas de prata de 1oz', completed: false },
      { id: 'sec7', text: 'Estoque sementes de rápido crescimento (Alface, Rabanete)', completed: false },
      { id: 'sec8', text: 'Saiba o valor de troca de 1 litro de Biodiesel', completed: false }
    ]
  },
  {
    id: 's16',
    title: 'Navegação Analógica e Mapas',
    category: 'SKILLS',
    content: `### MOVIMENTAÇÃO SEM GPS
O sinal de satélite pode ser desligado em conflitos globais.

### 1. O Mapa Físico
- **Impressão**: Tenha mapas topográficos da sua região num raio de 50km.
- **Impermeabilização**: Use contact transparente ou guarde em sacos Ziploc.

### 2. Bússola Improvisada (Sombra)
- Coloque uma vara no chão. Marque o fim da sombra.
- Espere 15 min. Marque a nova posição da sombra.
- A linha que une as duas marcas corre de Oeste para Leste.

### 3. Pace Counting (Contagem de Passos)
Saiba quantos passos você dá para percorrer 100 metros em terreno plano e em subida. Isso permite estimar distâncias no escuro ou neblina com precisão.

### 4. Pontos de Referência
Identifique montanhas, torres ou rios. Crie mini-mapas mentais do seu caminho de fuga.`,
    checklist: [
      { id: 'sk13', text: 'Imprima o mapa do seu bairro e rotas de fuga', completed: false },
      { id: 'sk14', text: 'Adquira uma bússola de placa (Suunto ou Silva)', completed: false },
      { id: 'sk15', text: 'Identifique o Cruzeiro do Sul ou Estrela Polar', completed: false },
      { id: 'sk16', text: 'Calcule seu "Pace Count" para 100 metros', completed: false }
    ]
  }
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
