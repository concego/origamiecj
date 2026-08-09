/**
 * Configuração central do OrigamiECJ.
 *
 * Todas as constantes globais do projeto ficam neste arquivo.
 * Para alterar fontes externas, credenciais de contato ou dados
 * do banco de referência, edite apenas este arquivo.
 */

/**
 * Endereço oficial do banco de dados de origami (origami-db), confirmado
 * durante o desenvolvimento deste projeto em 09/08/2026.
 *
 * Fonte consultada como REFERÊNCIA para padrões de vincos (crease patterns)
 * e modelos dobrados em 3D (folded obj equivalent).
 *
 * Licença da fonte: GPL-3.0
 * Autor da fonte: dozingpip
 *
 * IMPORTANTE: O OrigamiECJ NÃO copia dados, imagens, instruções ou modelos
 * do origami-db. Utilizamos apenas como referência técnica. Todos os
 * tutoriais e diagramas do OrigamiECJ são criações originais da equipe ECJ.
 *
 * @see https://github.com/dozingpip/origami-db
 */
export const ORIGAMI_DATABASE_URL = 'https://github.com/dozingpip/origami-db';
export const ORIGAMI_DATABASE_NAME = 'origami-db';
export const ORIGAMI_DATABASE_AUTHOR = 'dozingpip';
export const ORIGAMI_DATABASE_LICENSE = 'GPL-3.0';

/** Identidade do projeto. */
export const SITE_NAME = 'OrigamiECJ';

/** Equipe responsável. */
export const ECJ_TEAM_NAME = 'Eu Concego Jogar (ECJ)';

/**
 * Linha de crédito obrigatória do projeto.
 * Deve aparecer no rodapé, nas páginas Sobre, Créditos e Contato,
 * na documentação e nos metadados do código.
 */
export const CREDIT_LINE_PT =
  'OrigamiECJ é um projeto da equipe Eu Concego Jogar (ECJ).';
export const CREDIT_LINE_EN =
  'OrigamiECJ is a project by the team Eu Concego Jogar (ECJ).';

/** Contato oficial da equipe ECJ. */
export const ECJ_CONTACT_EMAIL = 'euconcego@gmail.com';

/** Idiomas suportados. O primeiro é o idioma padrão (fallback). */
export const SUPPORTED_LANGS = ['pt-BR', 'en'];
export const DEFAULT_LANG = 'pt-BR';

/**
 * Chaves usadas no localStorage do navegador.
 * O armazenamento é local e não envia dados a terceiros.
 */
export const STORAGE_KEYS = {
  language: 'origamiecj:lang',
  progress: 'origamiecj:progress',
  displayMode: 'origamiecj:display-mode',
  animations: 'origamiecj:animations',
};
