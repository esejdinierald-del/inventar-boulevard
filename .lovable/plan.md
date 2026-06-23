## Zëvendëso `src/services/stock-propagation.service.ts`

Aplikoj versionin e ri nga Claude që zëvendëson lock-un global boolean (`isPropagating`) me një **lock per-datë me timeout 60s** (`activePropagations: Map<string, {startedAt}>`).

### Përfitimet
- Propagime për data të ndryshme mund të ekzekutohen paralelisht (nuk bllokojnë njëra-tjetrën).
- Vetëm i njëjti `fromDate` bllokohet nga vetvetja (parandalon dyfishim).
- Timeout 60s e çliron lock-un automatikisht nëse një propagim ngec (p.sh. nga gabim rrjeti pa `finally`).

### Ndryshimet
- Hiq: `private static isPropagating = false`.
- Shto: `activePropagations: Map`, `LOCK_TIMEOUT_MS`, helperat `acquireLock(fromDate)` dhe `releaseLock(fromDate)`.
- `propagateFromDate` dhe `rebaseFromGjendje`: zëvendësojnë check-un e vjetër me `if (!acquireLock(fromDate)) return;` dhe `finally { releaseLock(fromDate); }`.
- Pjesa tjetër e logjikës (propagimi, rebase, `updateT1WithNewStock`, `updateT2FromT1`, `updateNextDayStock`) mbetet **identike** me kodin aktual.

### Verifikim
- Të 30 testet ekzistuese duhet të vazhdojnë të kalojnë (asnjë ndryshim formule).

Asnjë skedar tjetër nuk preket.
