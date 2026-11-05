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
    var p = global.ColeMathProfiles && ColeMathProfiles.getActive();
    if (p && p.setId && modules[p.setId]) return modules[p.setId];
    return modules['set1'] || null;
  }

  function list() {
    return Object.keys(modules).map(function (k) { return modules[k]; });
  }

  if (global.ColeMathSet1) register(global.ColeMathSet1);
  if (global.ColeMathTaya6) register(global.ColeMathTaya6);

  global.ColeMathQuestions = {
    register: register,
    get: get,
    current: current,
    list: list
  };
})(typeof window !== 'undefined' ? window : global);
