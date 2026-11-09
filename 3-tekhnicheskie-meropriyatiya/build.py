import re,json
tpl=open('v2_tpl/tpl.html').read()
css=re.search(r'<style>(.*?)</style>',tpl,re.S).group(1)+'\n'+open('extra.css').read()+'\n'+open('states.css').read()+'\n'+'\n'.join(l.replace('#sv','#g') for l in open('states.css').read().split('\n') if l.startswith('#sv') and not re.search(r'\.st\d',l))+'\n'+open('gstates.css').read()
Q=json.load(open('quotes.json'))
js="var $=function(s,r){return (r||document).querySelector(s)};\nfunction esc(s){return String(s).replace(/[&<>]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;'}[c]})}\nvar QUOTES="+json.dumps(Q,ensure_ascii=False)+";\n"+open('scenes.js').read()+"\n"+open('app.js').read()+"\n"+open('plak.js').read()+"\n"+open('game.js').read()+"\n"+open('quiz.js').read()
head=tpl[:tpl.index('<style>')].replace('<title>Работа под напряжением</title>','<title>Технические мероприятия</title>')
open('index.html','w').write(head+'<style>'+css+'</style>\n</head>\n<body>\n'+open('body.html').read()+'\n<script>\n'+js.replace('</script>','<\\/script>')+'\n</script>\n</body>\n</html>\n')
