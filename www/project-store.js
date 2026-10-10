(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.DoramaStore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const LEGACY = 'doramaProjectV13', LIBRARY = 'doramaLibraryV24';
  const clone = value => JSON.parse(JSON.stringify(value));
  const id = () => globalThis.crypto?.randomUUID?.() || 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2);
  function episode(project, number) {
    const found = project?.episodes?.find(e => Number(e.number) === Number(number));
    if (!found) throw new Error('Episódio não encontrado: ' + number);
    return found;
  }
  function snapshot(project) {
    if (!project || !Array.isArray(project.episodes)) throw new Error('Projeto sem lista de episódios válida.');
    if (!project.seasons) project.seasons = {'1': {episodes: project.episodes, memory: project.memory || []}};
    project.activeSeason = Number(project.activeSeason) || 1;
    const key = String(project.activeSeason);
    project.seasons[key] = {...project.seasons[key], episodes: project.episodes, memory: project.memory || []};
    return project;
  }
  function scenes(project, number) {
    const script = episode(project, number).script;
    if (script && !Array.isArray(script.scenes)) throw new Error('Roteiro inválido. Exporte uma cópia antes de reparar.');
    return script?.scenes || [];
  }
  function updateScene(project, number, index, patch) {
    const ep = episode(project, number);
    const list = scenes(project, number);
    if (index !== null && (!Number.isInteger(index) || !list[index])) throw new Error('Cena não encontrada.');
    if (!String(patch.place || '').trim() || !String(patch.action || '').trim()) throw new Error('Preencha local e descrição da cena.');
    if (patch.duration !== undefined && (!Number.isFinite(patch.duration) || patch.duration <= 0 || patch.duration > 3600)) throw new Error('Duração deve ser de 1 a 3600 segundos.');
    if (!Array.isArray(patch.dialogue)) throw new Error('Diálogos inválidos.');
    const previous = index === null ? {} : list[index];
    const scene = {...previous, ...clone(patch), id: previous.id || id()};
    if (!ep.script) ep.script = {scenes: [], hook: ''};
    if (index === null) ep.script.scenes.push(scene); else ep.script.scenes[index] = scene;
    return scene;
  }
  function moveScene(project, number, index, delta) {
    const list = scenes(project, number), target = index + delta;
    if (!list[index] || target < 0 || target >= list.length) return false;
    list.splice(target, 0, list.splice(index, 1)[0]); return true;
  }
  function removeScene(project, number, index) {
    const list = scenes(project, number);
    if (!list[index]) throw new Error('Cena não encontrada.');
    const ep = episode(project, number);
    ep.deletedScenes = [...(ep.deletedScenes || []), {scene: clone(list[index]), index, deletedAt: new Date().toISOString()}];
    return list.splice(index, 1)[0];
  }
  function restoreScene(project, number) {
    const ep = episode(project, number), last = ep.deletedScenes?.at(-1);
    if (!last) return false;
    if (!ep.script) ep.script = {scenes: [], hook: ''};
    ep.script.scenes.splice(Math.min(last.index, ep.script.scenes.length), 0, last.scene);
    ep.deletedScenes.pop(); return true;
  }
  function readLibrary(storage) {
    const raw = storage.getItem(LIBRARY);
    if (!raw) return {};
    const value = JSON.parse(raw);
    if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error('Biblioteca local inválida. Nenhum dado foi sobrescrito.');
    return value;
  }
  function save(storage, project) {
    const copy = snapshot(clone(project));
    copy.localId = copy.localId || id();
    const library = readLibrary(storage);
    const legacy = storage.getItem(LEGACY);
    if (legacy) {
      // Keep the original bytes, including malformed JSON, before updating the compatibility pointer.
      if (!storage.getItem('doramaOriginalV13')) storage.setItem('doramaOriginalV13', legacy);
      try {
        const old = JSON.parse(legacy);
        if (old && Array.isArray(old.episodes)) {
          const same = old.localId === copy.localId || (old.cloudId && old.cloudId === copy.cloudId);
          if (!same) library[old.localId || ('legacy-' + (old.cloudId || 'v13'))] = old;
        }
      } catch (_) { /* Original bytes remain recoverable. */ }
    }
    library[copy.localId] = copy;
    // The library is authoritative. A quota failure here leaves all old projects intact.
    storage.setItem(LIBRARY, JSON.stringify(library));
    project.localId = copy.localId;
    try { storage.setItem(LEGACY, JSON.stringify(copy)); } catch (_) { /* Saved in the library. */ }
    return copy;
  }
  function projects(storage) {
    const values = Object.values(readLibrary(storage));
    const raw = storage.getItem(LEGACY);
    if (raw) {
      const legacy = JSON.parse(raw);
      if (legacy && !values.some(p => (p.localId && p.localId === legacy.localId) || (p.cloudId && p.cloudId === legacy.cloudId))) values.push(legacy);
    }
    return values;
  }
  function plan(project, number) {
    const ep = episode(project, number);
    return {format: 'dorama-studio-production/v2', title: project.title, season: Number(project.activeSeason || 1), episode: ep.number,
      episodeTitle: ep.title, summary: ep.summary, cast: clone(project.characters || []), storyBible: clone(project.storyBible || {}),
      scenes: scenes(project, number).map((scene, index) => ({...clone(scene), order: index + 1})), cliffhanger: ep.script?.hook || '',
      note: 'Clipes locais ficam neste aparelho. Use a exportação de cada arquivo para montar no editor de vídeo.'};
  }
  return {LEGACY, LIBRARY, clone, id, episode, snapshot, scenes, updateScene, moveScene, removeScene, restoreScene, save, projects, readLibrary, plan};
});
