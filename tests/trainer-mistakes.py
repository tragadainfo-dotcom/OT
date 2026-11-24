"""Error-only mode preserves topic/NTD scope and the historical study-error pool."""
from playwright.sync_api import sync_playwright,expect
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844},accept_downloads=True);errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:8000/trainer/');expect(page.locator('#home')).to_be_visible()
 page.locator('[data-mode=mistakes]').click()
 expect(page.locator('.study-topic')).to_have_count(3)
 expect(page.locator('#study-all')).to_be_disabled()
 assert all(not page.locator('.study-document').nth(i).is_enabled() for i in range(page.locator('.study-document').count()))
 page.locator('.home-button:visible').first.click()
 fixture=page.evaluate('''async()=>{
  const b=(await(await fetch('questions.json')).json()).questions,s=TrainerEngine.fresh();
  s.settings.questionOrder='original';s.settings.successPause=3000;
  const ids=TrainerEngine.studyGroups(b).map(t=>t.ids[0]);
  ids.forEach(id=>{const q=b.find(q=>q.id===id);TrainerEngine.record(s,q,[],1000,'study',100000,'study');TrainerEngine.record(s,q,q.correct,1000,'study2',100001,'study');});
  const others=b.filter(q=>!ids.includes(q.id));
  TrainerEngine.record(s,others[0],[],1000,'reinforce',100002,'reinforce');
  s.questions[others[1].id]={...TrainerEngine.empty(),manual:true};
  TrainerEngine.record(s,others[2],others[2].correct,1000,'study',100003,'study');
  TrainerEngine.record(s,others[3],[],1000,'legacy',100004,'study');delete s.questions[others[3].id].studyErrors;
  ids.push(others[3].id);await TrainerStorage.save(s);return {ids,excluded:others.slice(0,3).map(q=>q.id)};
 }''')
 page.reload();expect(page.locator('#mistakes-count')).to_have_text('Осталось: 4 из 4')
 page.locator('[data-mode=mistakes]').click()
 expect(page.locator('#catalogue-title')).to_have_text('Работа над ошибками')
 expect(page.locator('.study-topic')).to_have_count(3)
 expect(page.locator('#study-all-restart')).to_be_hidden()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='/workspace/trainer-mistakes-mobile.png',full_page=True)
 page.locator('.study-document:enabled').first.click();expect(page.locator('#practice')).to_be_visible()
 scope=page.evaluate('TrainerStorage.load().then(s=>s.active.order)')
 assert scope and all(id in fixture['ids'] for id in scope)
 assert page.evaluate("TrainerStorage.load().then(s=>s.active.mode)")=='mistakes'
 page.locator('#exit').click();page.locator('[data-mode=mistakes]').click();page.locator('#study-all').click()
 page.wait_for_function('TrainerStorage.load().then(s=>!!s.active?.current)')
 assert set(page.evaluate('TrainerStorage.load().then(s=>s.active.order)'))==set(fixture['ids'])
 expect(page.locator('#position')).to_have_text('1 / 4')
 for i in range(4):
  page.wait_for_function('TrainerStorage.load().then(s=>!!s.active?.current&&!s.active.current.answered)')
  q=page.evaluate("async()=>{const s=await TrainerStorage.load(),b=(await(await fetch('questions.json')).json()).questions;return b.find(q=>q.id===s.active.current.id)}")
  assert q['id'] in fixture['ids'] and q['id'] not in fixture['excluded']
  expect(page.locator('#question')).to_have_text(q['text'])
  for aid in q['correct']:page.locator(f'[data-answer-id="{aid}"]').click()
  if len(q['correct'])>1:page.locator('#confirm-answer').click()
  expect(page.locator('#feedback')).to_contain_text('Верно');page.locator('#next').click()
 expect(page.locator('#finished')).to_be_visible();expect(page.locator('#again')).to_be_hidden();expect(page.locator('#study-restart')).to_be_visible()
 page.locator('#study-restart').click();expect(page.locator('#position')).to_have_text('1 / 4')
 page.reload();page.locator('#resume').click();expect(page.locator('#mode-name')).to_have_text('Работа над ошибками')
 assert set(page.evaluate('TrainerStorage.load().then(s=>s.active.order)'))==set(fixture['ids'])
 page.locator('#exit').click();expect(page.locator('#mistakes-count')).to_have_text('Осталось: 4 из 4')
 page.locator('#stats-open').click()
 with page.expect_download() as download:page.locator('#export').click()
 import json
 from pathlib import Path
 backup=json.loads(Path(download.value.path()).read_text())
 assert all(backup['questions'][id].get('studyErrors',backup['questions'][id]['errors'])>0 for id in fixture['ids'])
 assert not errors,errors
 print('PASS empty mode, three topics/NTD groups, study-only provenance, legacy errors, no clean/new/manual questions, repeated correct review, reload, backup, mobile')
 browser.close()
