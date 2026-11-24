"""Manual bookmarks and separate pass-to-completion rounds."""
from playwright.sync_api import sync_playwright,expect
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 page=browser.new_page(viewport={'width':390,'height':844});errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)));page.on('dialog',lambda d:d.accept())
 page.goto('http://127.0.0.1:8000/trainer/');expect(page.locator('#home')).to_be_visible()
 page.evaluate("async()=>{const s=TrainerEngine.fresh();s.settings.questionOrder='original';s.settings.successPause=3000;await TrainerStorage.save(s)}")
 page.reload();page.locator('[data-mode=focus]').click();expect(page.locator('#study-all')).to_be_disabled();expect(page.locator('.study-topic')).to_have_count(3)
 page.locator('.home-button:visible').first.click();page.locator('[data-mode=study]').click();page.locator('#study-all').click()
 def question():
  page.wait_for_function('TrainerStorage.load().then(s=>!!s.active?.current&&!s.active.current.answered)')
  return page.evaluate("async()=>{const a=(await TrainerStorage.load()).active,b=(await(await fetch('questions.json')).json()).questions;return b.find(q=>q.id===a.current.id)}")
 def answer(q,right=True):
  expect(page.locator('#question')).to_have_text(q['text'])
  ids=q['correct'] if right else [next(o['id'] for o in q['options'] if o['id'] not in q['correct'])]
  for aid in ids:page.locator(f'[data-answer-id="{aid}"]').click()
  if len(q['correct'])>1:page.locator('#confirm-answer').click()
  expect(page.locator('#next')).to_be_visible()
 first=question();answer(first);page.locator('#hard').click();expect(page.locator('#hard')).to_have_text('★ На проработке');page.locator('#previous').click();expect(page.locator('#hard')).to_have_attribute('aria-pressed','true');answer(first);page.locator('#next').click()
 second=question();answer(second,False);page.locator('#hard').click();page.locator('#exit').click()
 expect(page.locator('#focus-count')).to_have_text('Осталось: 2 из 2');expect(page.locator('#mistakes-count')).to_have_text('Осталось: 1 из 1')
 page.locator('[data-mode=focus]').click();page.locator('#study-all').click();expect(page.locator('#position')).to_have_text('1 / 2')
 q=question();assert q['id']==first['id'];answer(q)
 page.locator('#previous').click();assert page.evaluate('TrainerStorage.load().then(s=>s.questions[s.active.current.id].focusPassed)')==False
 answer(q);page.locator('#next').click();q=question();assert q['id']==second['id'];answer(q,False);page.locator('#next').click()
 expect(page.locator('#finished')).to_be_visible();expect(page.locator('#session-result')).to_contain_text('Осталось в группе: 1')
 page.locator('#again').click();expect(page.locator('#position')).to_have_text('1 / 1');q=question();assert q['id']==second['id']
 page.reload();page.locator('#resume').click();expect(page.locator('#mode-name')).to_have_text('Дополнительная проработка');answer(q);page.locator('#next').click()
 expect(page.locator('#again')).to_be_hidden();expect(page.locator('#study-restart')).to_have_text('Пройти заново')
 page.locator('#to-home').click();expect(page.locator('#focus-count')).to_have_text('Осталось: 0 из 2');expect(page.locator('#mistakes-count')).to_have_text('Осталось: 1 из 1')
 page.locator('[data-mode=focus]').click();group=page.locator('.study-document').filter(has_text='ПУЭ')
 expect(group).to_contain_text('Верно 1 из 1 · Осталось 0')
 before=page.evaluate('TrainerStorage.load().then(s=>s.sequence)')
 group.locator('..').locator('.study-group-restart').click();expect(page.locator('#position')).to_have_text('1 / 1')
 assert page.evaluate('TrainerStorage.load().then(s=>s.sequence)')==before
 assert page.evaluate('(id)=>TrainerStorage.load().then(s=>s.questions[id].focusPassed)',second['id'])
 assert page.evaluate('(id)=>TrainerStorage.load().then(s=>s.questions[id].studyPassed)',first['id'])
 page.locator('#hard').click();expect(page.locator('#finished')).to_be_visible()
 assert not page.evaluate('(id)=>TrainerStorage.load().then(s=>s.questions[id].manual)',first['id'])
 page.locator('#to-home').click();expect(page.locator('#focus-count')).to_have_text('Осталось: 0 из 1')
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 assert not errors,errors
 print('PASS manual correct/error bookmarks, three topics, separate queues, undo, remaining-only batches, reload, finish, per-NTD restart, independent progress, unmark')
 browser.close()
