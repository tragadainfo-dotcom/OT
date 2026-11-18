"""Topic/NTD catalogue and filtered session regression checks."""
from playwright.sync_api import sync_playwright,expect
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:8000/trainer/');expect(page.locator('#home')).to_be_visible()
 page.evaluate("async()=>{const s=await TrainerStorage.load()||TrainerEngine.fresh();s.settings.sessionSize=100;s.settings.successPause=3000;await TrainerStorage.save(s)}")
 page.reload();expect(page.locator('#home')).to_be_visible()
 page.locator('[data-mode=study]').click();expect(page.locator('#study')).to_be_visible()
 expect(page.locator('.study-topic')).to_have_count(3)
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.screenshot(path='/workspace/trainer-topics-mobile.png',full_page=True)
 page.locator('.study-document').filter(has_text='903н').click()
 page.wait_for_function('TrainerStorage.load().then(s=>!!s.active?.current)')
 assert page.evaluate("async()=>{const a=(await TrainerStorage.load()).active,b=(await(await fetch('questions.json')).json()).questions;return a.order.length===149&&a.order.every(id=>b.find(q=>q.id===id).text.includes('903н'))}")
 page.reload();page.locator('#resume').click();expect(page.locator('#topic')).to_contain_text('903н')
 page.locator('#exit').click();page.locator('[data-mode=study]').click()
 page.locator('.study-theme').first.click()
 page.wait_for_function('TrainerStorage.load().then(s=>s.active?.order.length===92)')
 expect(page.locator('#practice')).to_be_visible()
 page.locator('#exit').click();page.locator('[data-mode=study]').click()
 page.locator('.study-document').filter(has_text='НТД в вопросе не указан').click()
 expect(page.locator('#position')).to_have_text('1 / 11')
 for i in range(11):
  page.wait_for_function('TrainerStorage.load().then(s=>!!s.active?.current&&!s.active.current.answered)')
  q=page.evaluate("async()=>{const a=(await TrainerStorage.load()).active,b=(await(await fetch('questions.json')).json()).questions;return b.find(q=>q.id===a.current.id)}")
  expect(page.locator('#question')).to_have_text(q['text'])
  for aid in q['correct']:page.locator(f'[data-answer-id="{aid}"]').click()
  if len(q['correct'])>1:page.locator('#confirm-answer').click()
  expect(page.locator('#feedback')).to_contain_text('Верно')
  page.locator('#next').click()
 expect(page.locator('#finished')).to_be_visible()
 expect(page.locator('#again')).to_be_hidden()
 page.locator('#study-restart').click();expect(page.locator('#practice')).to_be_visible()
 assert page.evaluate('TrainerStorage.load().then(s=>s.active.order.length)')==11
 assert page.evaluate('TrainerStorage.load().then(s=>Object.values(s.questions).reduce((n,q)=>n+q.shows,0))')==11
 assert not errors,errors
 print('PASS 3 topics, NTD filter, whole-topic filter, reload, small-group completion, continue same group, preserved progress and mobile layout')
 browser.close()
