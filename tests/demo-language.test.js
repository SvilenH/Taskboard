import test from 'node:test';
import assert from 'node:assert/strict';
import { upgradeDemoLanguage } from '../src/services/demo-language.js';

test('legacy demo translation preserves edits, custom records, ordering and attachments', () => {
  const state = {
    projects: [{id:'website',title:'Новият ни уебсайт',description:'My edited description'}, {id:'custom',title:'Новият ни уебсайт'}],
    tasks: [{id:'task-0',project_id:'website',title:'Проучване на добри примери',description:'My task notes',stage_id:'website-2',position:7,due_date:'2026-12-01'}],
    stages: [{id:'website-2',name:'Завършени',is_done:true},{id:'custom-stage',name:'My review stage'}],
    profiles:[{id:'demo-owner',display_name:'Custom name'}], roles:[{user_id:'demo-owner',role:'admin'}],
    attachments:[{id:'my-file',task_id:'task-0',original_name:'моят файл.txt'}],
  };
  const preserved = structuredClone(state);
  assert.equal(upgradeDemoLanguage(state), true);
  assert.equal(state.projects[0].title, 'Our new website');
  assert.equal(state.projects[0].description, preserved.projects[0].description);
  assert.deepEqual(state.projects[1], preserved.projects[1]);
  assert.deepEqual(state.tasks[0], {...preserved.tasks[0], title:'Research inspiring examples'});
  assert.equal(state.stages[0].name, 'Done');
  assert.deepEqual(state.stages[1], preserved.stages[1]);
  assert.deepEqual(state.attachments, preserved.attachments);
  assert.deepEqual(state.profiles, preserved.profiles);
  assert.deepEqual(state.roles, preserved.roles);
  assert.equal(upgradeDemoLanguage(state), false, 'upgrade runs only once');
});

test('an intentionally empty demo stays empty', () => {
  const state = {projects:[],tasks:[],stages:[],profiles:[],roles:[],attachments:[]};
  upgradeDemoLanguage(state);
  assert.deepEqual(state, {projects:[],tasks:[],stages:[],profiles:[],roles:[],attachments:[],uiLanguage:'en'});
});
