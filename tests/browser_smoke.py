"""Browser UI smoke test using cached dummy dashboard. No real Google API required."""
from pathlib import Path
import json,re
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
html=(ROOT/'dist/index.html').read_text()
# The smoke test executes the generated self-contained HTML in about:blank. The
# external Google Fonts import is removed because the sandbox blocks outbound HTTP.
html=re.sub(r'@import url\([^;]*fonts\.googleapis\.com[^;]*;', '', html)
token='ds_'+'1'*8+'-1111-4111-8111-'+'1'*12+'_'+'2'*8+'-2222-4222-8222-'+'2'*12
h=2166136261
for c in token:
    h=(h^ord(c))*16777619 & 0xffffffff
chars='0123456789abcdefghijklmnopqrstuvwxyz';suffix=''
while h:
    h,r=divmod(h,36);suffix=chars[r]+suffix
cache='darkovnik_dashboard_v2_'+(suffix or '0')
user={'id':'u_alice','email':'alice@example.com','name':'Jana Nováková','birthday':'1995-04-12','avatar':''}
group={'id':'g_rodina','name':'Rodina','description':'Naše rodina','image':'','role':'admin','ownerId':'u_alice','members':[{'id':'u_alice','name':'Jana Nováková','role':'admin','avatar':''},{'id':'u_bob','name':'Petr Svoboda','role':'member','avatar':''}], 'pendingInvites':[], 'birthdaysEnabled':'true','easterEnabled':'false','namedaysEnabled':'false','holidaysSelected':'[]'}
gift={'id':'w1','ownerId':'u_alice','name':'Bezdrátová sluchátka','price':'2490','quantity':2,'receivedQuantity':0,'groupIds':['g_rodina'],'notes':'Černá barva','url':'','image':'','priority':'high'}
other={'id':'w2','ownerId':'u_bob','ownerName':'Petr Svoboda','name':'Turistický batoh','price':'1790','quantity':1,'receivedQuantity':0,'groupIds':['g_rodina'],'available':1,'mine':[],'notes':'','url':'','image':'','priority':'none'}
data={'profile':user,'groups':[group],'holidayOptions':[],'myGifts':[gift],'visibleGifts':[other],'myReservations':[],'events':[{'id':'ev1','groupId':'g_rodina','name':'Oslava','date':'2026-12-01','repeatYearly':'false','kind':'custom','automatic':False}],'alerts':[]}
storage={'darkovnik_session_v1':token,cache:json.dumps({'savedAt':1795300000000,'data':data})}
# savedAt is overwritten with current browser Date.now() during setup
init='''<script>(function(){const value=JSON.parse('''+json.dumps(json.dumps(storage))+'''); const map=new Map(Object.entries(value)); for(const k of [...map.keys()])if(k.startsWith('darkovnik_dashboard')){const x=JSON.parse(map.get(k));x.savedAt=Date.now();map.set(k,JSON.stringify(x))}Object.defineProperty(window,'localStorage',{configurable:true,value:{getItem:k=>map.has(k)?map.get(k):null,setItem:(k,v)=>map.set(k,String(v)),removeItem:k=>map.delete(k)}});})();</script>'''
html=html.replace('<body><div id="root"></div>', '<body><div id="root"></div>'+init,1)

with sync_playwright() as p:
    browser=p.chromium.launch(executable_path='/usr/bin/chromium',headless=True,args=['--no-sandbox','--disable-dev-shm-usage'])
    for width,height in [(390,844),(1366,860),(320,650)]:
        page=browser.new_page(viewport={'width':width,'height':height});errors=[]
        page.on('pageerror',lambda exc:errors.append(str(exc)))
        page.goto('about:blank')
        page.evaluate('(html)=>{document.open();document.write(html);document.close()}',html)
        page.wait_for_timeout(500)
        assert page.get_by_role('heading',name='Co je nového?').count()==1,('overview missing',width,errors)
        assert not errors,(width,errors)
        assert page.evaluate('document.documentElement.scrollWidth<=window.innerWidth+4'),f'horizontal overflow: {width}'
        page.get_by_role('button',name='Moje přání').first.click()
        assert page.get_by_text('Bezdrátová sluchátka').count()>=1,(width,'wish not shown')
        page.get_by_role('button',name='Nové přání').first.click()
        assert page.get_by_role('dialog').count()==1
        assert page.get_by_text('Cena v Kč').count()>=1
        page.get_by_role('button',name='Zavřít').last.click()
        page.get_by_role('button',name='Skupiny').first.click()
        assert page.get_by_text('Rodina').count()>=1
        page.get_by_role('button',name='Kalendář').first.click()
        assert page.get_by_role('heading',name='Kalendář').count()>=1
        assert not errors,(width,errors)
        if width==390:
            page.screenshot(path='/mnt/data/darkovnik-smoke-mobile.png',full_page=True)
        print('PASS browser responsive interaction',width,'px')
        page.close()
    browser.close()
