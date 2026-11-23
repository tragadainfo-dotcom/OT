"""Run with the site served at http://127.0.0.1:8000 (Python Playwright + Chromium)."""
import json
import re
from pathlib import Path
from playwright.sync_api import sync_playwright, expect
ROOT=Path(__file__).resolve().parents[1]
BANK=json.loads((ROOT/'trainer/questions.json').read_text())['questions']
URL='http://127.0.0.1:8000/trainer/'

def read_state(page):
    return page.evaluate('()=>TrainerStorage.load()')

def configure(page):
    page.locator('#settings-open').click()
    page.locator('[name=questionOrder]').select_option('original')
    page.locator('[name=successPause]').fill('3000')
    page.locator('[name=sessionSize]').fill('5')
    page.locator('#settings-form button').click()

def ready(page):
    expect(page.locator('#home')).to_be_visible()

def install_fixture(page, skip_to=None):
    page.evaluate('''async skip=>{
      const s=TrainerEngine.fresh();s.settings.questionOrder='original';s.settings.successPause=3000;s.settings.sessionSize=5;
      const bank=(await (await fetch('questions.json')).json()).questions;
      for(const q of bank.slice(0,skip||0))TrainerEngine.record(s,q,q.correct,1000,'fixture',100000,'study');
      await TrainerStorage.save(s);
    }''',skip_to)
    page.reload();ready(page)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
    context=browser.new_context(accept_downloads=True,viewport={'width':390,'height':844})
    page=context.new_page();errors=[]
    page.on('pageerror',lambda error:errors.append(str(error)))
    page.goto(URL);ready(page);configure(page)
    page.locator('[data-mode=study]').click();page.locator('#study-all').click()
    q=BANK[0];expect(page.locator('#question')).to_have_text(q['text'])
    wrong=next(o['id'] for o in q['options'] if o['id'] not in q['correct'])
    page.locator(f'[data-answer-id="{wrong}"]').click()
    expect(page.locator('.answer.wrong')).to_have_count(1)
    expect(page.locator('.answer.correct')).to_have_count(len(q['correct']))
    assert read_state(page)['questions'][q['id']]['errors']==1
    page.reload();ready(page);page.locator('#resume').click()
    expect(page.locator('.answer.wrong')).to_have_count(1)
    page.locator('#previous').click()
    assert read_state(page)['questions'][q['id']]['errors']==0
    page.locator(f'[data-answer-id="{q["correct"][0]}"]').click()
    expect(page.locator('#feedback')).to_contain_text('Верно')
    page.locator('#next').click()
    page.locator('#previous').click()
    expect(page.locator('#question')).to_have_text(q['text'])
    assert read_state(page)['questions'][q['id']]['shows']==0
    page.locator(f'[data-answer-id="{q["correct"][0]}"]').click()
    page.locator('#exit').click();page.locator('#stats-open').click()
    before=read_state(page)
    with page.expect_download() as download:
        page.locator('#export').click()
    exported=json.loads(Path(download.value.path()).read_text())
    assert exported['questions']==before['questions']
    page.locator('#import').set_input_files({'name':'broken.json','mimeType':'application/json','buffer':b'{"schemaVersion":99}'})
    expect(page.locator('#notice')).to_contain_text('Импорт не выполнен')
    assert read_state(page)['questions']==before['questions']
    page.on('dialog',lambda dialog:dialog.accept())
    page.locator('#reset').click()
    assert not read_state(page)['questions']
    page.locator('#import').set_input_files({'name':'progress.json','mimeType':'application/json','buffer':json.dumps(exported).encode()})
    expect(page.locator('#notice')).to_contain_text('Прогресс восстановлен')
    assert read_state(page)['questions']==before['questions']
    print('PASS wrong/correct, persistent reload, undo before/after advance, export/import/reset')

    multi_index=next(i for i,q in enumerate(BANK) if len(q['correct'])>1)
    install_fixture(page,multi_index)
    # Shuffle options independently and verify evaluation by answer IDs.
    page.locator('#settings-open').click();page.locator('[name=answerOrder]').select_option('random');page.locator('#settings-form button').click()
    page.locator('[data-mode=study]').click();page.locator('#study-all').click()
    multi=BANK[multi_index];expect(page.locator('#question')).to_have_text(multi['text'])
    page.locator(f'[data-answer-id="{multi["correct"][0]}"]').click()
    expect(page.locator('#feedback')).to_have_text('')
    page.locator('#confirm-answer').click()
    expect(page.locator('#feedback')).to_contain_text('Не совсем')
    page.locator('#previous').click()
    for answer_id in reversed(multi['correct']):
        page.locator(f'[data-answer-id="{answer_id}"]').click()
    page.locator('#confirm-answer').click();expect(page.locator('#feedback')).to_contain_text('Верно')
    page.locator('#hard').click();expect(page.locator('#hard')).to_have_attribute('aria-pressed','true')
    assert read_state(page)['questions'][multi['id']]['manual']
    assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
    page.screenshot(path='/workspace/trainer-mobile.png',full_page=True)
    print('PASS multi-select incomplete/full sets, shuffled options, manual difficult mark, mobile layout')

    # All four stages are accessible and each answer contributes to its own stage.
    page.locator('#exit').click()
    for day in range(1,5):
        page.locator('#days button').nth(day-1).click()
        expect(page.locator('#mode-name')).to_contain_text(f'День {day}')
        active=read_state(page)['active'];question=next(q for q in BANK if q['id']==active['current']['id'])
        for aid in question['correct']:
            page.locator(f'[data-answer-id="{aid}"]').click()
        if len(question['correct'])>1:page.locator('#confirm-answer').click()
        expect(page.locator('#feedback')).to_contain_text('Верно')
        assert question['id'] in read_state(page)['days'][str(day)]
        page.locator('#exit').click()
    print('PASS all four preparation stages save separate coverage')

    # Auto transition is enabled only with configured pauses; mistakes default to manual.
    install_fixture(page)
    page.locator('#settings-open').click();page.locator('[name=successPause]').fill('300');page.locator('#settings-form button').click()
    page.locator('[data-mode=study]').click();page.locator('#study-all').click()
    page.locator(f'[data-answer-id="{BANK[0]["correct"][0]}"]').click()
    expect(page.locator('#question')).not_to_have_text(BANK[0]['text'])
    print('PASS automatic next question after a correct answer')

    # Shared navigation remains in its approved order and searches the trainer.
    assert page.locator('.ot-bar').inner_text().splitlines()==['Разделы','Домой','Поиск']
    page.locator('.ot-search').click();page.locator('#ot-nav-query').fill('тренажёр')
    expect(page.locator('.ot-results a')).to_have_count(1)
    page.keyboard.press('Escape');expect(page.locator('.ot-menu')).to_be_hidden()
    page.locator('#exit').click()
    page.evaluate('navigator.serviceWorker.ready.then(()=>true)')
    page.wait_for_function('navigator.serviceWorker.controller !== null')
    page.wait_for_function("caches.open('ot-trainer-v5').then(c=>c.match('../site-nav.js?v=2')).then(Boolean)")
    context.set_offline(True);page.reload();ready(page)
    page.locator('#resume').click();expect(page.locator('#options button').first).to_be_visible()
    assert page.locator('.ot-bar').is_visible()
    print('PASS service worker offline reload with question bank, shared navigation and progress')
    context.set_offline(False)
    # A second tab cannot overwrite the active tab's IndexedDB state.
    tab=context.new_page();tab.goto(URL);expect(tab.locator('#loading')).to_contain_text('другой вкладке');tab.close()
    print('PASS concurrent-tab protection')
    page.locator('#exit').click()
    for width in [360,390,768,1280]:
        page.set_viewport_size({'width':width,'height':900})
        assert page.evaluate('document.documentElement.scrollWidth<=innerWidth'),width
    page.set_viewport_size({'width':1280,'height':900});page.screenshot(path='/workspace/trainer-desktop.png',full_page=True)
    assert not errors,errors
    context.close()
    # Existing pages and search still execute without JS exceptions.
    context=browser.new_context();page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    for folder in ['']+[p.name+'/' for p in sorted(ROOT.iterdir()) if p.is_dir() and re.match(r'^\d+-',p.name) and (p/'index.html').exists()]:
        response=page.goto('http://127.0.0.1:8000/'+folder,wait_until='domcontentloaded');assert response.status==200
        expect(page.locator('.ot-bar')).to_be_visible()
    assert not errors,errors
    print('PASS responsive viewports 360/390/768/1280 and regression checks on existing lessons; no JS errors')
    context.close()
    context=browser.new_context(service_workers='block')
    page=context.new_page();page.on('pageerror',lambda e:errors.append(str(e)))
    page.goto(URL);ready(page);install_fixture(page)
    page.locator('[data-mode=study]').click();page.locator('#study-all').click()
    expect(page.locator('#question')).to_have_text(BANK[0]['text'])
    page.evaluate("()=>{window.originalSave=TrainerStorage.save;TrainerStorage.save=async()=>{throw Error('Test storage failure')}}")
    page.locator(f'[data-answer-id="{BANK[0]["correct"][0]}"]').click()
    expect(page.locator('#notice')).to_contain_text('Не удалось сохранить')
    assert read_state(page)['questions'][BANK[0]['id']]['shows']==0
    expect(page.locator('#next')).to_be_hidden()
    page.evaluate('()=>{TrainerStorage.save=window.originalSave}')
    page.locator(f'[data-answer-id="{BANK[0]["correct"][0]}"]').click()
    expect(page.locator('#feedback')).to_contain_text('Верно')
    assert read_state(page)['questions'][BANK[0]['id']]['shows']==1
    page.locator('#exit').click()
    saved_question=read_state(page)['questions'][BANK[0]['id']]
    updated={'schemaVersion':1,'version':'test-update','questions':BANK[1:]}
    context.route('**/questions.json',lambda route:route.fulfill(status=200,content_type='application/json',body=json.dumps(updated)))
    page.reload();ready(page)
    assert read_state(page)['questions'][BANK[0]['id']]==saved_question
    page.on('dialog',lambda d:d.accept())
    page.locator('[data-mode=study]').click();page.locator('#study-all').click()
    for i in range(5):
        page.wait_for_function('TrainerStorage.load().then(s=>!!s.active?.current&&!s.active.current.answered)')
        active=read_state(page)['active'];current=next(q for q in BANK if q['id']==active['current']['id'])
        expect(page.locator('#question')).to_have_text(current['text'])
        for aid in current['correct']:page.locator(f'[data-answer-id="{aid}"]').click()
        if len(current['correct'])>1:page.locator('#confirm-answer').click()
        expect(page.locator('#feedback')).to_contain_text('Верно')
        page.locator('#next').click()
    expect(page.locator('#finished')).to_be_visible()
    print('PASS storage failure does not count/advance, bank update preserves orphaned progress, session completion')
    assert not errors,errors
    browser.close()
