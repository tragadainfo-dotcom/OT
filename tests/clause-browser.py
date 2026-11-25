from playwright.sync_api import sync_playwright,expect
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);c=b.new_context(viewport={'width':390,'height':844});page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8000/');original=page.url;page.locator('.ot-search').click();expect(page.locator('.ot-doc')).to_be_visible();assert page.url==original
 expect(page.locator('#ot-doc-query')).to_be_focused();expect(page.locator('#ot-doc-query')).to_have_attribute('inputmode','text')
 expect(page.locator('.ot-doc-status')).to_contain_text('Введите номер')
 page.locator('#ot-doc-query').fill('20');page.locator('.ot-doc-dot').click();page.locator('#ot-doc-query').press('4');expect(page.locator('#ot-doc-query')).to_have_value('20.4')
 expect(page.locator('[data-entry-id="regulation-20.4"]')).to_be_visible()
 expected=page.evaluate("fetch('223n/document.json').then(r=>r.json()).then(d=>d.entries.find(e=>e.id==='regulation-20.4').blocks.map(i=>d.blocks[i].text).filter(Boolean))")
 expect(page.locator('[data-entry-id="regulation-20.4"] .document-block')).to_have_text(expected)
 page.locator('#ot-doc-query').fill('1');expect(page.locator('[data-entry-id="order-1"]')).to_be_visible();expect(page.locator('[data-entry-id="regulation-1"]')).to_be_attached();expect(page.locator('[data-entry-id="forms-1"]')).to_be_attached()
 assert page.locator('#ot-site-nav select').count()==0
 page.locator('#ot-doc-query').fill('Зарегистрировано');expect(page.locator('.ot-doc-results .clause-card').first).to_be_visible()
 page.locator('#ot-doc-query').fill('999');expect(page.locator('.ot-doc-results .clause-card')).to_have_count(0);expect(page.locator('.ot-doc-status')).to_contain_text('Ничего не найдено')
 page.locator('.ot-doc-clear').click();expect(page.locator('#ot-doc-query')).to_have_value('');expect(page.locator('#ot-doc-query')).to_be_focused()
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('.ot-sections').click();expect(page.locator('.ot-entry').first).to_be_visible();page.locator('.ot-search').click();expect(page.locator('#ot-doc-query')).to_be_focused();page.keyboard.press('Escape');expect(page.locator('.ot-menu')).to_be_hidden();expect(page.locator('.ot-search')).to_be_focused();assert not page.locator('main').evaluate('(el)=>el.inert')
 page.locator('.ot-sections').click();expect(page.locator('#ot-nav-query')).to_be_visible();assert page.locator('.ot-entry[href*="223n"]').count()==0
 page.locator('.ot-search').click();expect(page.locator('#ot-doc-query')).to_be_focused();expect(page.locator('#ot-nav-query')).to_be_hidden()
 page.keyboard.press('Escape');page.locator('a.card[href="trainer/"]').click();expect(page.locator('#home')).to_be_visible();url=page.url
 before=page.evaluate('TrainerStorage.load()');page.locator('.ot-search').click();page.locator('#ot-doc-query').fill('20.4');expect(page.locator('[data-entry-id="regulation-20.4"]')).to_be_visible();assert page.url==url;assert page.evaluate('TrainerStorage.load()')==before
 page.keyboard.press('Escape');page.locator('[data-mode=study]').click();page.locator('#study-all').click();expect(page.locator('#practice')).to_be_visible()
 state=page.evaluate('TrainerStorage.load()');page.locator('.ot-search').click();page.locator('#ot-doc-query').fill('20.4');expect(page.locator('[data-entry-id="regulation-20.4"]')).to_be_visible();page.keyboard.press('Escape');expect(page.locator('#practice')).to_be_visible();assert page.evaluate('TrainerStorage.load()')==state
 page.locator('.ot-search').click();page.locator('#ot-doc-query').fill('20.4');expect(page.locator('[data-entry-id="regulation-20.4"]')).to_be_visible();page.screenshot(path='/workspace/clause-menu-mobile.png')
 assert not errors,errors
 print('PASS bottom-sheet lookup without navigation, all sections/preamble, text keyboard and dot insertion, clear, focus/Escape, section switching, mobile and unchanged active training')
 b.close()
