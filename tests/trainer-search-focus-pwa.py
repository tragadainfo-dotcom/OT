"""Bookmark a search result; check shared app scope and iOS standalone link routing."""
from playwright.sync_api import sync_playwright,expect
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 context=browser.new_context(viewport={'width':390,'height':844});context.add_init_script("Object.defineProperty(navigator,'standalone',{get:()=>true})")
 page=context.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8000/');expect(page.locator('.ot-bar')).to_be_visible()
 assert page.locator('link[rel=manifest]').get_attribute('href')=='manifest.webmanifest'
 assert page.locator('meta[name=apple-mobile-web-app-capable]').get_attribute('content')=='yes'
 page.locator('a.card[href="trainer/"]').click();expect(page.locator('#home')).to_be_visible()
 assert len(context.pages)==1
 assert page.locator('link[rel=manifest]').get_attribute('href')=='../manifest.webmanifest'
 scope=page.evaluate("async()=>{const url=document.querySelector('link[rel=manifest]').href,m=await(await fetch(url)).json();return new URL(m.scope,url).pathname}")
 assert scope=='/'
 assert page.evaluate("fetch('manifest.webmanifest').then(r=>r.json()).then(m=>m.scope)")=='../'
 q=page.evaluate("async()=>{const b=(await(await fetch('questions.json')).json()).questions,s=TrainerEngine.fresh();TrainerEngine.record(s,b[0],b[0].correct,1000,'prior',100000,'study');await TrainerStorage.save(s);return b[0]}")
 page.reload();expect(page.locator('#home')).to_be_visible()
 before=page.evaluate('TrainerStorage.load()')
 page.locator('#question-search-open').click();page.locator('#question-search-input').fill(q['text'][:85])
 article=page.locator(f'[data-question-id="{q["id"]}"]');button=article.locator('.search-focus')
 expect(button).to_have_attribute('aria-pressed','false');button.click();expect(button).to_have_attribute('aria-pressed','true')
 after=page.evaluate('TrainerStorage.load()');assert after['questions'][q['id']]['manual'];assert after['questions'][q['id']]['focusPassed']==False
 assert after['questions'][q['id']]['studyPassed'];assert after['sequence']==before['sequence']
 for key in ['shows','correct','errors']:assert after['questions'][q['id']][key]==before['questions'][q['id']][key]
 page.reload();expect(page.locator('#focus-count')).to_have_text('Осталось: 1 из 1')
 page.locator('#question-search-open').click();page.locator('#question-search-input').fill(q['text'][:85]);button=page.locator(f'[data-question-id="{q["id"]}"] .search-focus');expect(button).to_have_attribute('aria-pressed','true');button.click();expect(button).to_have_attribute('aria-pressed','false')
 assert not page.evaluate('(id)=>TrainerStorage.load().then(s=>s.questions[id].manual)',q['id'])
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('.ot-home').click();expect(page.locator('a.card[href="trainer/"]')).to_be_visible();assert len(context.pages)==1
 page.locator('a.card[href="1-pod-napryazheniem/"]').click();expect(page.locator('.ot-bar')).to_be_visible()
 assert page.locator('meta[name=apple-mobile-web-app-capable]').get_attribute('content')=='yes'
 assert page.locator('link[rel=manifest]').evaluate('(el)=>new URL(el.href).pathname')=='/manifest.webmanifest'
 assert len(context.pages)==1 and not errors,errors
 print('PASS search add/remove bookmark persists without changing attempt counters; shared manifest scope, legacy app identity, standalone same-window trainer/home/lesson navigation')
 browser.close()
