import test from 'node:test';
import assert from 'node:assert/strict';
import { groupProjects, projectState, filterProjects } from '../src/utils/workspace.js';
import { projectCard } from '../src/components/project-card.js';

const projects=[
  {id:'planned',owner_id:'alex',title:'Campaign',description:'Next launch',color:'sage'},
  {id:'active',owner_id:'boyan',title:'Portfolio',description:'Home page',color:'blue'},
  {id:'complete',owner_id:'alex',title:'Handover',description:'Delivery notes',color:'sage'},
  {id:'empty',owner_id:'boyan',title:'New project',description:'',color:'blue'}
];
const stages=projects.flatMap(p=>[{id:p.id+'-todo',project_id:p.id,position:0,is_done:false},{id:p.id+'-progress',project_id:p.id,position:1,is_done:false},{id:p.id+'-done',project_id:p.id,position:2,is_done:true}]);
const data={projects,profiles:[{id:'alex',display_name:'Alex'},{id:'boyan',display_name:'Boyan'}],stages,tasks:[{id:'1',project_id:'planned',stage_id:'planned-todo'},{id:'2',project_id:'active',stage_id:'active-progress'},{id:'3',project_id:'active',stage_id:'active-done'},{id:'4',project_id:'complete',stage_id:'complete-done'}]};

test('project status distinguishes unstarted, started, completed and empty work',()=>{
  assert.equal(projectState(projects[0],data).key,'planned');
  assert.equal(projectState(projects[1],data).key,'active');
  assert.equal(projectState(projects[2],data).key,'completed');
  assert.equal(projectState(projects[3],data).key,'planned');
  assert.equal(projectState(projects[1],data).completed,1);
});
test('owner, status and search filters combine without leaking another owner into the view',()=>{
  const before=structuredClone(data);
  assert.deepEqual(filterProjects(projects,data,{owner:'alex',status:'completed',query:'notes'}).map(p=>p.id),['complete']);
  assert.equal(filterProjects(projects,data,{owner:'boyan',status:'completed'}).length,0);
  assert.equal(filterProjects(projects,data,{owner:'unknown'}).length,0);
  assert.deepEqual(data,before);
});
test('groups keep owners separate even when their display names match',()=>{
  const profiles=[{id:'alex',display_name:'Same name'},{id:'boyan',display_name:'Same name'}];
  const groups=groupProjects(projects,{...data,profiles});
  assert.equal(groups.length,2);
  assert.ok(groups.every(g=>g.projects.every(p=>p.owner_id===g.ownerId)));
  assert.equal(groups.reduce((n,g)=>n+g.projects.length,0),4);
});
test('project cards escape owner and project content and identify completed work',()=>{
  const unsafe={...data,profiles:[{id:'alex',display_name:'<img src=x onerror=alert(1)>'}]};
  const card=projectCard({...projects[2],title:'<script>alert(1)</script>'},unsafe,'alex');
  assert.ok(card.includes('Owner:'));
  assert.ok(card.includes('&lt;img'));
  assert.ok(card.includes('&lt;script&gt;'));
  assert.ok(card.includes('Completed'));
  assert.ok(!card.includes('<img'));
  assert.ok(!card.includes('<script>'));
});
