// Testes da política de conteúdo de terceiros (lib/collectors/BaseCollector.newsSnippet).
// Rodar: npx tsx tests/test-content-policy.ts
import { newsSnippet } from '../lib/collectors/BaseCollector';

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) failures++;
    console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : `\n     esperado ${JSON.stringify(expected)}\n     obtido   ${JSON.stringify(actual)}`}`);
}

check('trecho: vazio', newsSnippet(undefined), '');
check('trecho: tira HTML e espaços', newsSnippet('<p>Ataque  em <b>Kiev</b></p>\n<img src=x>'), 'Ataque em Kiev');
check('trecho: tag aberta no fim também sai', newsSnippet('Texto <img src=x onerror=alert(1) '), 'Texto');
const long = 'palavra '.repeat(100);
const s = newsSnippet(long);
check('trecho: corta em ≤ 281 caracteres', s.length <= 281, true);
check('trecho: termina em reticências sem cortar palavra', /palavra…$/.test(s), true);

console.log(failures ? `\n❌ ${failures} falha(s)` : '\n✅ todos os testes passaram');
process.exit(failures ? 1 : 0);
