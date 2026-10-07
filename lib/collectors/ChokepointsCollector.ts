// Publica chokepoints.json (lib/layers/chokepoints.ts) no Storage para a camada
// "Gargalos marítimos" do mapa. Roda no grupo 6, junto com o SignsCollector.
import { computeChokepoints } from '../layers/chokepoints';
import { publishData } from '../publishData';

export class ChokepointsCollector {
    async run(): Promise<void> {
        try {
            const payload = await computeChokepoints(new Date());
            const worst = payload.chokepoints[0];
            console.log(`⚓ CHOKEPOINTS: ${payload.chokepoints.length} gargalos${worst ? ` · pior: ${worst.name} ${worst.changePct}%` : ''}`);
            await publishData('chokepoints.json', payload);
        } catch (err) {
            console.error('❌ CHOKEPOINTS: falhou:', err instanceof Error ? err.message : err);
        }
    }
}
