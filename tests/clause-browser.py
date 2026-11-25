from playwright.sync_api import sync_playwright,expect
with sync_playwright() as p:
 b=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox']);c=b.new_context(viewport={'width':390,'height':844});page=c.new_page();errors=[];page.on('pageerror',lambda e:errors.append(str(e)))
 page.goto('http://127.0.0.1:8000/');page.locator('.ot-search').click();expect(page).to_have_url('http://127.0.0.1:8000/223n/index.html')
 expect(page.locator('#clause-status')).to_contain_text('Введите номер')
 page.locator('#clause-query').fill('20.4');expect(page.locator('.clause-card')).to_have_count(1);expect(page.locator('[data-entry-id="regulation-20.4"]')).to_be_visible()
 expected=page.evaluate("fetch('document.json').then(r=>r.json()).then(d=>d.entries.find(e=>e.id==='regulation-20.4').blocks.map(i=>d.blocks[i].text).filter(Boolean))")
 expect(page.locator('.clause-card .document-block')).to_have_text(expected)
 page.locator('#clause-query').fill('20');assert page.locator('.clause-card').count()>1
 page.locator('#clause-query').fill('1');expect(page.locator('.clause-card')).to_have_count(1)
 page.locator('#clause-scope').select_option('order');expect(page.locator('[data-entry-id="order-1"]')).to_be_visible();expect(page.locator('.clause-card')).to_have_count(1)
 page.locator('#clause-scope').select_option('forms');page.locator('#clause-query').fill('2');expect(page.locator('[data-entry-id="forms-2"]')).to_be_visible();assert page.locator('.document-table').count()>0
 assert page.evaluate('document.documentElement.scrollWidth<=innerWidth')
 page.locator('#clause-scope').select_option('regulation');page.locator('#clause-query').fill('999');expect(page.locator('.clause-card')).to_have_count(0);expect(page.locator('#clause-status')).to_contain_text('не найден')
 page.locator('#clause-clear').click();expect(page.locator('#clause-query')).to_have_value('');expect(page.locator('#clause-query')).to_be_focused()
 page.locator('.ot-search').click();expect(page.locator('#clause-query')).to_be_focused()
 page.locator('#full-document summary').click();expect(page.locator('#document-content .document-table').first).to_be_visible()
 page.locator('.ot-sections').click();page.locator('#ot-nav-query').fill('223н');expect(page.locator('.ot-results a')).to_have_count(1);page.keyboard.press('Escape')
 page.evaluate('navigator.serviceWorker.ready.then(()=>true)');page.wait_for_function('navigator.serviceWorker.controller!==null')
 c.set_offline(True);page.reload();expect(page.locator('#clause-status')).to_contain_text('Введите номер');page.locator('#clause-query').fill('20.4');expect(page.locator('[data-entry-id="regulation-20.4"]')).to_be_visible()
 assert not errors,errors
 print('PASS bottom navigation, exact clause and complete text, parent/subclauses, distinct scopes, tables, clear, menu, mobile and offline lookup')
 b.close()
