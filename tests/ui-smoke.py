from playwright.sync_api import sync_playwright
from pathlib import Path
import json,time
html=Path(__file__).resolve().parents[1].joinpath('dist/index.html').read_text()
uid='ds_test_test'
h=2166136261
for c in uid:h=((h^ord(c))*16777619)&0xffffffff
cache_key='darkovnik_live_dashboard_v1_'+format(h,'x') # convert to base36 below
alphabet='0123456789abcdefghijklmnopqrstuvwxyz';a=h;h36=''
while a:h36=alphabet[a%36]+h36;a//=36
cache_key='darkovnik_live_dashboard_v1_'+(h36 or '0')
group='group123456';owner='user123456';bob='user654321'
data={'profile':{'id':owner,'name':'Jana Nováková','email':'jana@example.com','birthday':'1990-08-12'},'groups':[{'id':group,'name':'Rodina Novákových','description':'Naše společná přání','ownerId':owner,'role':'admin','members':[{'id':owner,'name':'Jana Nováková','role':'admin'},{'id':bob,'name':'Petr Novák','role':'member'}],'pendingInvites':[]}],'myGifts':[{'id':'gift-one','ownerId':owner,'name':'Kávovar Sage','price':'8990','quantity':'1','receivedQuantity':'0','groupIds':[group],'priority':'high'}],'visibleGifts':[{'id':'gift-two','ownerId':bob,'ownerName':'Petr Novák','name':'Bezdrátová sluchátka','price':'2490','quantity':'2','available':1,'groupIds':[group],'mine':[]}],'myReservations':[{'id':'res-1','giftName':'Kniha Umění klidu','personName':'Petr Novák','quantity':1,'status':'reserved'}],'events':[{'id':'event-1','groupId':group,'name':'Petr Novák','date':'1995-11-25','repeatYearly':'true','kind':'birthday','automatic':True}],'alerts':[]}
js="Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem(k){if(k==='darkovnik_session_v1')return '"+uid+"';if(k==='"+cache_key+"')return "+json.dumps(json.dumps({'time':int(time.time()*1000),'data':data})) + ";return null;},setItem(){},removeItem(){}}});"
html=html.replace('<div id="root"></div>','<div id="root"></div><script>'+js+'</script>')
with sync_playwright() as p:
 browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox'])
 for w in (390,1366):
  page=browser.new_page(viewport={'width':w,'height':850})
  errors=[];page.on('pageerror',lambda err:errors.append(str(err)))
  page.set_content(html,wait_until='domcontentloaded',timeout=8000)
  print('width',w,'initial',page.locator('h1').all_text_contents()[:2],'errors',errors)
  page.screenshot(path=str(Path(__file__).resolve().parents[1]/f'docs/home-{w}.png'),timeout=5000)
  page.locator('main').get_by_role('button',name='Přidat přání').first.click()
  assert page.get_by_role('dialog').is_visible()
  assert page.get_by_role('dialog').get_by_text('Nové přání').is_visible()
  page.locator('.flow-panel .flow-mobile-back' if w==390 else '.flow-panel .flow-close').click(timeout=1500)
  for screen in ('Moje přání','Skupiny','Kalendář','Zprávy') if w==390 else ('Moje přání','Skupiny','Kalendář','Zprávy','Profil'):
   try:
    (page.locator('nav.bottom-nav button') if w==390 and screen!='Profil' else page.locator('aside.sidebar nav button')).filter(has_text=('Přání' if w==390 and screen=='Moje přání' else screen)).first.click(timeout=2500)
    print(' ->',screen,'h1',page.locator('main h1').all_text_contents()[:1], 'errors',errors[-2:])
   except Exception as e: print(' click error',screen,str(e)[:90]);break
  page.close()
 browser.close()
