"""Correct study answers stay excluded across sessions until an explicit group restart."""
from playwright.sync_api import sync_playwright,expect
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page();page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:8000/trainer/');expect(page.locator('#home')).to_be_visible()
 ids=page.evaluate('''async()=>{
  const b=(await(await fetch('questions.json')).json()).questions,s=TrainerEngine.fresh();
  s.settings.questionOrder='original';s.settings.successPause=3000;
  const group=TrainerEngine.studyGroups(b)[0].documents.find(d=>d.id==='unspecified').ids;
  group.forEach((id,i)=>{const q=b.find(q=>q.id===id);TrainerEngine.record(s,q,i<9?q.correct:[],1000,'old',100000+i,'study');if(i<9)delete s.questions[id].studyPassed;});
  TrainerEngine.record(s,b[0],b[0].correct,1000,'old',100050,'study');
  await TrainerStorage.save(s);return group;
 }''')
 page.reload();expect(page.locator('#home')).to_be_visible()
 page.locator('[data-mode=study]').click()
 card=page.locator('.study-document').filter(has_text='НТД в вопросе не указан')
 expect(card).to_contain_text('Верно 9 из 11');card.click();expect(page.locator('#position')).to_have_text('1 / 2')
 def current():
  page.wait_for_function('TrainerStorage.load().then(s=>!!s.active?.current&&!s.active.current.answered)')
  return page.evaluate("async()=>{const s=await TrainerStorage.load(),b=(await(await fetch('questions.json')).json()).questions;return b.find(q=>q.id===s.active.current.id)}")
 def answer(q,correct=True):
  expect(page.locator('#question')).to_have_text(q['text'])
  answers=q['correct'] if correct else [next(o['id'] for o in q['options'] if o['id'] not in q['correct'])]
  for aid in answers:page.locator(f'[data-answer-id="{aid}"]').click()
  if len(q['correct'])>1:page.locator('#confirm-answer').click()
  expect(page.locator('#next')).to_be_visible();page.locator('#next').click()
 q=current();assert q['id']==ids[9];answer(q)
 q=current();assert q['id']==ids[10];answer(q,False)
 expect(page.locator('#finished')).to_be_visible();expect(page.locator('#session-result')).to_contain_text('Осталось в группе: 1')
 page.locator('#again').click();expect(page.locator('#position')).to_have_text('1 / 1');q=current();assert q['id']==ids[10]
 page.reload();expect(page.locator('#home')).to_be_visible();page.locator('#resume').click();expect(page.locator('#position')).to_have_text('1 / 1');answer(q)
 expect(page.locator('#finished')).to_be_visible();expect(page.locator('#again')).to_be_hidden()
 page.locator('#to-home').click();page.locator('[data-mode=study]').click()
 card=page.locator('.study-document').filter(has_text='НТД в вопросе не указан');expect(card).to_contain_text('Верно 11 из 11')
 totals=page.evaluate('TrainerStorage.load().then(s=>[s.sequence,Object.values(s.questions).reduce((n,q)=>n+q.correct,0)])')
 card.locator('..').locator('.study-group-restart').click();expect(page.locator('#position')).to_have_text('1 / 11')
 assert page.evaluate('TrainerStorage.load().then(s=>[s.sequence,Object.values(s.questions).reduce((n,q)=>n+q.correct,0)])')==totals
 assert page.evaluate("async()=>{const s=await TrainerStorage.load(),b=(await(await fetch('questions.json')).json()).questions;return s.questions[b[0].id].studyPassed}")
 print('PASS legacy progress migration, only failed questions across batches/reload, completed state, explicit group restart without resetting other progress/statistics')
 browser.close()
