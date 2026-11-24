"""Partial question lookup returns every correct answer without recording an attempt."""
from pathlib import Path
import json
from playwright.sync_api import sync_playwright,expect
bank=json.loads((Path(__file__).resolve().parents[1]/'trainer/questions.json').read_text())['questions']
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844});page=context.new_page();errors=[]
 page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8000/trainer/');expect(page.locator('#home')).to_be_visible()
 page.evaluate('async()=>{const s=TrainerEngine.fresh();await TrainerStorage.save(s)}');page.reload();expect(page.locator('#home')).to_be_visible()
 before=page.evaluate('TrainerStorage.load()')
 page.locator('#question-search-open').click();expect(page.locator('#question-search')).to_be_visible()
 expect(page.locator('#question-search-input')).to_be_focused()
 expect(page.locator('.search-question')).to_have_count(0)
 for q in [bank[0],next(q for q in bank if len(q['correct'])>1)]:
  page.locator('#question-search-input').fill(q['text'][:85].upper())
  article=page.locator(f'[data-question-id="{q["id"]}"]');expect(article).to_be_visible()
  expect(article.locator('h3')).to_have_text(q['text'])
  expect(article.locator('.search-correct-answers li')).to_have_text([o['text'] for o in q['options'] if o['id'] in q['correct']])
  expect(article.locator('.source')).to_have_attribute('href',f'sources/{q["sources"][0]["file"]}#page={q["sources"][0]["page"]}')
  assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('#question-search-input').fill('пересечение');expect(page.locator(f'[data-question-id="{bank[0]["id"]}"]')).to_be_visible()
 page.locator('#question-search-input').fill('<img src=x onerror=alert(1)>');expect(page.locator('.search-question')).to_have_count(0)
 expect(page.locator('#question-search-status')).to_contain_text('Ничего не найдено')
 page.locator('#question-search-input').fill('');expect(page.locator('.search-question')).to_have_count(0)
 page.locator('#question-search-input').fill('периодичность');assert page.locator('.search-question').count()>1
 assert page.evaluate('TrainerStorage.load()')==before
 page.evaluate('navigator.serviceWorker.ready.then(()=>true)');page.wait_for_function('navigator.serviceWorker.controller!==null')
 context.set_offline(True);page.reload();expect(page.locator('#home')).to_be_visible();page.locator('#question-search-open').click();page.locator('#question-search-input').fill('пересечение')
 expect(page.locator(f'[data-question-id="{bank[0]["id"]}"]')).to_be_visible()
 assert page.evaluate('TrainerStorage.load()')==before
 assert not errors,errors
 print('PASS separate question search, partial/case/mixed-letter matching, complete single/multiple correct answers, PDF links, no results/clear, mobile, offline, unchanged statistics')
 browser.close()
