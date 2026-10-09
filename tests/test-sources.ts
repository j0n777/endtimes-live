// Testes dos leitores de fontes do Ω (lib/signs/ibtracs.ts, lib/signs/xlsx.ts).
// Rodar: npx tsx tests/test-sources.ts
import { strToU8, zipSync } from 'fflate';
import { countBetween, majorStormsFromCsv, mergeRecent } from '../lib/signs/ibtracs';
import { readXlsxSheet } from '../lib/signs/xlsx';
import { unreachedShare } from '../lib/signs/gospel';

let failures = 0;
function check(name: string, actual: unknown, expected: unknown) {
    const ok = JSON.stringify(actual) === JSON.stringify(expected);
    if (!ok) failures++;
    console.log(`${ok ? '✅' : '❌'} ${name}${ok ? '' : `\n     esperado ${JSON.stringify(expected)}\n     obtido   ${JSON.stringify(actual)}`}`);
}

// IBTrACS: primeira vez em categoria 3+, ignorando ramificações "spur"
const csv = [
    'SID,SEASON,ISO_TIME,TRACK_TYPE,USA_SSHS',
    ' ,Year, , ,1',
    'A,2026,2026-09-01 00:00:00,main,1',
    'A,2026,2026-09-02 06:00:00,main,3',
    'A,2026,2026-09-03 00:00:00,main,4',
    'B,2026,2026-09-05 00:00:00,PROVISIONAL,2',
    'C,2026,2026-09-07 00:00:00,main_spur,5',
    'D,2026,2026-09-08 00:00:00,US-PROVISIONAL,3',
    'E,2026,2026-09-09 00:00:00,main, ',
].join('\n');
check('ibtracs: ciclones fortes', majorStormsFromCsv(csv), { storms: { A: '2026-09-02', D: '2026-09-08' }, firstDate: '2026-09-01' });
check('ibtracs: parte recente substitui o catálogo a partir da data',
    mergeRecent({ OLD: '2020-01-01', A: '2026-08-30', X: '2026-09-04' }, { A: '2026-09-02' }, '2026-09-01'),
    { OLD: '2020-01-01', A: '2026-09-02' });
check('ibtracs: contagem no intervalo [de, até)', countBetween(['2026-01-01', '2026-02-01', '2026-03-01'], '2026-01-01', '2026-03-01'), 2);

// XLSX mínimo: textos compartilhados, números e células vazias no meio
const xlsx = zipSync({
    'xl/workbook.xml': strToU8('<workbook><sheets><sheet name="Monthly Indices" sheetId="1" r:id="rId1"/></sheets></workbook>'),
    'xl/_rels/workbook.xml.rels': strToU8('<Relationships><Relationship Id="rId1" Target="worksheets/sheet1.xml"/></Relationships>'),
    'xl/sharedStrings.xml': strToU8('<sst><si><t>Food **</t></si><si><t>1960M01</t></si></sst>'),
    'xl/worksheets/sheet1.xml': strToU8('<worksheet><sheetData><row r="1"><c r="C1" t="s"><v>0</v></c></row><row r="2"><c r="A2" t="s"><v>1</v></c><c r="C2"><v>21.2</v></c></row></sheetData></worksheet>'),
});
check('xlsx: lê a aba pelo nome, com colunas posicionadas', readXlsxSheet(xlsx, 'Monthly Indices'), [['', '', 'Food **'], ['1960M01', '', '21.2']]);

// Joshua Project: fração da população em povos não alcançados
const jp = [
    'Joshua Project People Group Data',
    '',
    'Ctry,PeopNameInCountry,Population,LeastReached',
    'AF,"Afghan, Tajik",750,Y',
    'BR,Brazilian,250,N',
    'XX,Sem dado,,Y',
].join('\n');
check('joshua project: % não alcançados e grupos', unreachedShare(jp), { percent: 75, groups: 1 });

console.log(failures ? `\n❌ ${failures} falha(s)` : '\n✅ todos os testes passaram');
process.exit(failures ? 1 : 0);
