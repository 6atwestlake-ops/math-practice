/* Question module registry — Set 2 / Set 3 plug in here later. */
(function (global) {
  'use strict';
  var modules = {};

  function register(mod) {
    if (!mod || !mod.id) throw new Error('module needs id');
    modules[mod.id] = mod;
  }

  function get(id) {
    return modules[id] || null;
  }

  function current() {
    // Default to Set 1; later: pick from settings / unlocked sets
    return modules['set1'] || null;
  }

  function list() {
    return Object.keys(modules).map(function (k) { return modules[k]; });
  }

  // Auto-register Set 1 if already loaded
  if (global.ColeMathSet1) register(global.ColeMathSet1);

  global.ColeMathQuestions = {
    register: register,
    get: get,
    current: current,
    list: list
  };
})(typeof window !== 'undefined' ? window : global);
