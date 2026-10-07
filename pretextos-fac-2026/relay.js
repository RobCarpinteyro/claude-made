/* Canal laptop ↔ iPhone · Polar Multimedia
   Dos vías a la vez: MQTT (HiveMQ, sin cuota) y ntfy.sh (respaldo).
   Cada mensaje lleva un id; si llega por las dos vías se procesa una sola vez.
   ntfy solo se usa cuando el otro lado no está en MQTT, y se pausa 60 s si responde 429. */
(function(){
  function rid(){return Math.random().toString(36).slice(2,10);}
  window.Relay=function(sala,onMsg,onStatus){
    var me=rid(),seen={},order=[],R={mq:false,nt:false,peerMq:false,ntPause:0};
    var MQ=window.RELAY_MQTT||'wss://broker.hivemq.com:8884/mqtt',MT='polar/pretextos/'+sala,NT='https://ntfy.sh/polar-pretextos-'+sala;
    function st(){try{onStatus&&onStatus(R);}catch(e){}}
    function handle(m,via){if(!m||!m.i)return;if(via==='mq'&&m.f!==me&&!R.peerMq){R.peerMq=true;st();}
      if(seen[m.i])return;seen[m.i]=1;order.push(m.i);if(order.length>400)delete seen[order.shift()];
      if(m.f===me)return;try{onMsg(m);}catch(e){}}
    var cli=null;
    if(window.mqtt&&!window.RELAY_NO_MQ){try{
      cli=mqtt.connect(MQ,{clientId:'pp_'+me,keepalive:20,reconnectPeriod:2000,connectTimeout:8000,clean:true});
      cli.on('connect',function(){R.mq=true;cli.subscribe(MT,{qos:1});st();});
      cli.on('close',function(){if(R.mq){R.mq=false;st();}});
      cli.on('offline',function(){if(R.mq){R.mq=false;st();}});
      cli.on('error',function(){});
      cli.on('message',function(t,p){try{handle(JSON.parse(p.toString()),'mq');}catch(e){}});
    }catch(e){cli=null;}}
    if(!window.RELAY_NO_NT){try{
      var es=new EventSource(NT+'/sse');
      es.onopen=function(){R.nt=true;st();};
      es.onerror=function(){if(R.nt){R.nt=false;st();}};
      es.onmessage=function(e){try{var d=JSON.parse(e.data);if(d.event&&d.event!=='message')return;handle(JSON.parse(d.message),'nt');}catch(x){}};
    }catch(e){}}
    R.send=function(o){o.i=rid();o.f=me;var s=JSON.stringify(o);seen[o.i]=1;order.push(o.i);
      if(cli&&R.mq){try{cli.publish(MT,s,{qos:1});}catch(e){}}
      if(window.RELAY_NO_NT)return;
      if(R.mq&&R.peerMq)return;                       // el otro lado ya escucha por MQTT: no gastamos cuota de ntfy
      if(Date.now()<R.ntPause)return;
      fetch(NT,{method:'POST',body:s}).then(function(r){if(r.status===429){R.ntPause=Date.now()+60000;st();}}).catch(function(){});};
    R.ok=function(){return R.mq||R.nt;};
    return R;
  };
})();
