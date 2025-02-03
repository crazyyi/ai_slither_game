(()=>{var S=document.getElementById("gameCanvas"),b=S.height*4,I=S.width*4,N=S.width,L=S.height,i=S.getContext("2d"),P=document.getElementById("stats"),z=document.getElementById("radarCanvas"),w=z.getContext("2d");var ht=700,at=360,rt=8,lt=2e3,V=120,K=240,Z=360,H=350,j=0,ct=["#FF0000","#90EE90","#0000FF","#FFFF00","#FFA500","#800080","#00FFFF","#FF69B4","#FFD700","#ADFF2F","#FF4500","#1E90FF"],Q=["Slither","Coil","Wiggle","Zigzag","Slink","Curve","Loop","Spiral","Twist","Turn","Wind","Weave","Dart","Dash","Streak","Flash","Glide","Sweep","Dive","Soar","Creep","Crawl","Skulk","Prowl","Lurk","Sneak","Slide","Slip","Shimmy","Wobble","Undulate","Meander","Serpent","Viper","Python","Cobra","Mamba","Asp","Krait","Taipan"],J=["#FF69B4","#FFD700","#00FF00","#00FFFF","#FF00FF","#ADFF2F","#FFA500","#FFB6C1","#FFFF00","#00CED1","#90EE90","#FF7F50","#FF6347","#7CFC00","#AFEEEE","#F0E68C","#FFFAFA","#DA70D6","#DB7093","#FFC0CB","#FFEFD5","#FFA07A","#98FB98","#FFB347","#FFFFE0"],U={USE_DUAL_COLORS:!0,PLAYER_DUAL_COLOR_CHANCE:1,BOT_DUAL_COLOR_CHANCE:.5},B={turningSpeed:.15,turningSpeedMultiplier:1,directionSmoothing:.1,minSegmentDistance:2,maxSegmentDistance:2.2,smoothingStrength:.1,damping:.8,turnTighteningFactor:.3,maxBendAngle:45},G=class{static isNameTaken(t,e){return e.some(s=>s.name===t&&s.isAlive&&!s.isDying)}constructor(t,e,s,n=!1,h="Player"){this.color=s,this.isBot=n,this.name=h,this.useDualColors=U.USE_DUAL_COLORS&&this.shouldUseDualColors(),this.secondaryColor=this.useDualColors?this.generateSecondaryColor(s):s,this.SAFE_SPAWN_DISTANCE=80,this.RESPAWN_TIME=180,this.MIN_SEGMENT_SIZE=1.5,this.BASE_LENGTH=30,this.MAX_LENGTH=Math.floor(this.BASE_LENGTH*12),this.GROWTH_RATE=.01,this.SPEED_BOOST_COST=2,this.BASE_SPEED=160,this.SPEED_BOOST=1.5,this.x=t,this.y=e,this.segments=[],n&&this.reset(t,e),this.size=6,this.lives=2,this.isAlive=!0,this.respawnTimer=0,this.targetPoint=null,this.opacity=1,this.isDying=!1,this.deathProgress=0,this.foodEaten=0,this.MAX_FOOD_EATEN_FOR_SEGMENT=30,this.growthProgress=0,this.baseSpeed=this.BASE_SPEED,this.speed=this.baseSpeed,this.speedBoost=1.5,this.isSpeedingUp=!1,this.speedBoostCost=2,this.lastSpeedBoostTime=0,this.lastLengthChangeTime=0,this.cursorX=0,this.cursorY=0,this.trail=[],this.targetDirection={...this.direction},this.turningSpeed=B.turningSpeed,this.turningSpeedMultiplier=B.turningSpeedMultiplier,this.directionSmoothing=B.directionSmoothing,this.minSegmentDistance=B.minSegmentDistance,this.maxSegmentDistance=B.maxSegmentDistance,this.smoothingStrength=B.smoothingStrength,this.damping=B.damping,this.turnTighteningFactor=B.turnTighteningFactor,this.maxBendAngle=B.maxBendAngle}reset(t,e){this.x=t,this.y=e,this.segments=[],this.segments.push({x:t,y:e});let s=Math.random()*2*Math.PI;this.direction={x:Math.cos(s),y:Math.sin(s)},this.targetDirection={...this.direction},this.isAlive=!0,this.opacity=1,this.isDying=!1,this.deathProgress=0}shouldUseDualColors(){let t=this.isBot?U.BOT_DUAL_COLOR_CHANCE:U.PLAYER_DUAL_COLOR_CHANCE;return Math.random()<t}getCurrentMaxLength(){let t=this.MAX_LENGTH-this.BASE_LENGTH,e=Math.min(t*this.foodEaten*this.GROWTH_RATE,t);return Math.floor(this.BASE_LENGTH+e)}grow(t){let s=1+this.segments.length/11;s=Math.min(s,this.MAX_FOOD_EATEN_FOR_SEGMENT);let n=t/s;this.growthProgress+=n,this.growthProgress>=1&&(this.growthProgress-=1,this.segments.push({...this.segments[this.segments.length-1]})),this.foodEaten+=n}update(t,e,s){this.updatedScale=this.segments.length>Z?2.8:this.segments.length>K?2.4:this.segments.length>V?2:1.6;let n=this.getCurrentMaxLength();if(this.isSpeedingUp){if(this.segments.length<=this.BASE_LENGTH){this.isSpeedingUp=!1,this.speed=this.baseSpeed;return}let f=Date.now();if(this.lastShrinkTime||(this.lastShrinkTime=f),f-this.lastShrinkTime>=200){if(this.segments.length>this.BASE_LENGTH){let x=this.segments.pop();if(x){let A=x.x+(Math.random()-.5)*10,D=x.y+(Math.random()-.5)*10,F=new R;F.position={x:A,y:D},t.push(F),this.foodEaten=Math.max(0,this.foodEaten-.2)}}else this.isSpeedingUp=!1;this.lastShrinkTime=f}this.speed=this.baseSpeed*this.SPEED_BOOST}else this.lastShrinkTime=null,this.speed=this.baseSpeed;if(this.isDying){this.deathProgress+=.02,this.opacity=Math.max(0,1-this.deathProgress),this.deathProgress>=1&&(this.isDying=!1,this.isAlive=!1,this.lives>0&&(this.respawnTimer=this.RESPAWN_TIME));return}if(!this.isAlive){if(this.lives<=0)return;this.respawnTimer--,this.respawnTimer<=0&&this.respawn();return}this.isBot&&this.updateAI(t,e);let h=Math.atan2(this.direction.y,this.direction.x)*180/Math.PI,a=Math.atan2(this.targetDirection.y,this.targetDirection.x)*180/Math.PI,r=gt(h,a,this.turningSpeed*s*this.turningSpeedMultiplier);this.direction.x=Math.cos(r*Math.PI/180),this.direction.y=Math.sin(r*Math.PI/180);let l=Math.sqrt(this.direction.x*this.direction.x+this.direction.y*this.direction.y);if(l===0?this.direction={x:1,y:0}:(this.direction.x/=l,this.direction.y/=l),this.targetDirection){let f=this.directionSmoothing,m=Math.atan2(this.direction.y,this.direction.x),M=Math.atan2(this.targetDirection.y,this.targetDirection.x)-m;for(;M>Math.PI;)M-=Math.PI*2;for(;M<-Math.PI;)M+=Math.PI*2;let A=m+M*f;this.direction.x=Math.cos(A),this.direction.y=Math.sin(A)}let c=this.segments[0],g=this.speed*s,d={x:c.x+this.direction.x*g,y:c.y+this.direction.y*g};this.segments.unshift(d),this.applySegmentSmoothing(s),this.isSpeedingUp?this.trail.push({x:d.x,y:d.y}):this.trail=[];for(let f=1;f<this.segments.length;f++){let m=this.segments[f-1],x=this.segments[f],M=m.x-x.x,A=m.y-x.y,D=Math.sqrt(M*M+A*A),F=Math.abs(this.targetDirection.x-this.direction.x)+Math.abs(this.targetDirection.y-this.direction.y),O=this.size*(3-this.turnTighteningFactor*F);if(D>O){let u=this.size*(1.5+F)/D;x.x=m.x-M*u,x.y=m.y-A*u}}for(;this.segments.length>n;)this.segments.pop()}applySegmentSmoothing(t){let e=this.size*this.minSegmentDistance,s=this.size*this.maxSegmentDistance,n=this.smoothingStrength;for(let h=1;h<this.segments.length;h++){let a=this.segments[h-1],r=this.segments[h],l=a.x-r.x,c=a.y-r.y,g=Math.sqrt(l*l+c*c);if(g<e)continue;let d=l/g,f=c/g,m=e,x=Math.abs(this.targetDirection.x-this.direction.x+this.targetDirection.y-this.direction.y);m-=x*this.size*.3;let M=a.x-d*m,A=a.y-f*m;r.vx||(r.vx=0),r.vy||(r.vy=0);let D=Math.min(g/s,1),F=n*(1+D);r.vx+=(M-r.x)*F,r.vy+=(A-r.y)*F;let O=this.damping;r.vx*=O,r.vy*=O,r.x+=r.vx*t,r.y+=r.vy*t,g>s&&(r.x=a.x-d*s,r.y=a.y-f*s,r.vx=0,r.vy=0)}}calculateBendAngle(t){let e=this.segments[t-1],s=this.segments[t],n=s.x-e.x,h=s.y-e.y;return Math.atan2(h,n)*(180/Math.PI)}applyBend(t,e){let s=Math.min(Math.max(e,-this.maxBendAngle),this.maxBendAngle);t.x+=Math.cos(s*Math.PI/180)*this.size*.05,t.y+=Math.sin(s*Math.PI/180)*this.size*.05}canSpeedBoost(){return this.segments.length>this.BASE_LENGTH}updateAI(t,e){let s=this.segments[0],n=50,h=200,a=300,r=.85,l=this.direction.x,c=this.direction.y,g=null,d=h,f=null,m=a,x=null,M=n;if(e.forEach(u=>{if(u!==this&&u.isAlive&&!u.isDying){let v=u.segments[0],C=v.x-s.x,W=v.y-s.y,T=Math.sqrt(C*C+W*W),k=u.segments.length/this.segments.length;if(k>1.2&&T<n*1.5?T<M&&(M=T,x=u):k<r&&T<a&&T<m&&(m=T,f=u),T<n){let $=1-T/n;l-=C/T*$*2,c-=W/T*$*2}}}),t.forEach(u=>{let v=u.position.x-s.x,C=u.position.y-s.y,W=Math.sqrt(v*v+C*C);W<d&&(d=W,g=u)}),x){let u=s.x-x.segments[0].x,v=s.y-x.segments[0].y,C=Math.sqrt(u*u+v*v);l=u/C,c=v/C}else if(f&&Math.random()<.7)l=(f.segments[0].x-s.x)/m,c=(f.segments[0].y-s.y)/m;else if(g)l=(g.position.x-s.x)/d,c=(g.position.y-s.y)/d;else{let u=Date.now()*.001;l=Math.cos(u*.5),c=Math.sin(u*.7)}let A=Math.sqrt(l*l+c*c),D={x:0,y:0};A>0&&(D={x:l/A,y:c/A});let F=.1;this.direction.x=this.direction.x*(1-F)+D.x*F,this.direction.y=this.direction.y*(1-F)+D.y*F;let O=Math.sqrt(this.direction.x*this.direction.x+this.direction.y*this.direction.y);this.direction.x/=O,this.direction.y/=O}getDistance(t,e){let s=t.x-e.x,n=t.y-e.y;return Math.sqrt(s*s+n*n)}respawn(){if(this.lives>0){let t=this.findSafeSpawnPosition();this.reset(t.x,t.y),this.targetPoint=null}}findSafeSpawnPosition(){let e=this.SAFE_SPAWN_DISTANCE*this.SAFE_SPAWN_DISTANCE;for(let s=0;s<20;s++){let n=Math.floor(Math.random()*(I-2*H))+H,h=Math.floor(Math.random()*(b-2*H))+H;if(!this.isPositionNearSnakes(n,h,e))return{x:n,y:h}}return{x:I/2,y:b/2}}isPositionNearSnakes(t,e,s){if(E.length===0)return!1;for(let n of E){if(n===this||!n.isAlive||n.isDying)continue;let h=t-n.segments[0].x,a=e-n.segments[0].y;if(h*h+a*a<s)return!0}return!1}generateSecondaryColor(t){if(Math.random()<.5){let e,s,n;if(t.startsWith("#")){let l=t.substring(1);e=parseInt(l.substring(0,2),16),s=parseInt(l.substring(2,4),16),n=parseInt(l.substring(4,6),16)}else if(t.startsWith("rgb"))[e,s,n]=t.match(/\d+/g).map(Number);else return Y();let h=255-e,a=255-s,r=255-n;return`rgb(${h}, ${a}, ${r})`}else return Y()}draw(){if(!this.isAlive&&!this.isDying)return;let t=1.6,e=1;if(this.segments.length>Z?e=2.8/t:this.segments.length>K?e=2.4/t:this.segments.length>V&&(e=2/t),i.globalAlpha=this.opacity,this.isSpeedingUp)for(let a=0;a<this.segments.length;a++){let r=this.segments[a],l=r.x-p.x,c=r.y-p.y;if(l>=-10&&l<=N+10&&c>=-10&&c<=L+10){let g=(a+1)/this.trail.length*.7,d=g*.5;i.fillStyle=`rgba(255, 215, 0, ${d})`,i.shadowColor="yellow",i.shadowBlur=10*e,i.beginPath();let f=Math.max(0,this.size*(1.6-a/this.trail.length/3))*t*e;i.arc(l,c,f,0,Math.PI*2),i.fill(),i.shadowColor="transparent",i.shadowBlur=0,i.fillStyle=`rgba(255, 170, 0, ${g})`,i.beginPath();let m=Math.max(0,this.size*(1.4-a/this.trail.length/3))*t*e;i.arc(l,c,m,0,Math.PI*2),i.fill()}}i.fillStyle=this.color;for(let a=this.segments.length-1;a>=0;a--){let r=this.segments[a],l=r.x-p.x,c=r.y-p.y;if(l>=-10&&l<=N+10&&c>=-10&&c<=L+10){let d=this.size*this.updatedScale;if(a===0){let f=this.direction.x*this.targetDirection.x+this.direction.y*this.targetDirection.y,m=Math.max(.3,f);d*=m}i.fillStyle=this.useDualColors&&Math.floor(a/10)%2===0?this.secondaryColor:this.color,i.beginPath(),i.arc(l,c,d,0,Math.PI*2),i.fill()}}let s=this.segments[0],n=s.x-p.x,h=s.y-p.y;if(n>=-10&&n<=N+10&&h>=-10&&h<=L+10){let a=this.updatedScale/t,r=this.updatedScale/t;i.fillStyle="white";let l=2*t*a,c=1.5*t*a,g=this.direction.x*l,d=this.direction.y*l;i.beginPath(),i.arc(n+g-d,h+d+g,c,0,Math.PI*2),i.arc(n+g+d,h+d-g,c,0,Math.PI*2),i.fill();let f=.9*r,m=c*.8,x=this.targetDirection.x*f,M=this.targetDirection.y*f,A=this.targetDirection.x*f,D=this.targetDirection.y*f;i.fillStyle="black",i.beginPath(),i.arc(n+g-d+x,h+d+g+M,m,0,Math.PI*2),i.arc(n+g+d+A,h+d-g+D,m,0,Math.PI*2),i.fill(),i.fillStyle="rgba(250, 250, 250, 0.6)",i.font=`bold ${12*t}px Arial`,i.textAlign="center",i.textBaseline="bottom";let F=this.size*Math.max(1-0/this.segments.length,this.MIN_SEGMENT_SIZE)*t+5;i.fillText(this.name,n,h-F)}i.globalAlpha=1}},R=class{constructor(t=!1){this.size=t?8:4,this.value=t?3:1,this.isFlying=t,this.resetPosition(),this.color=this.isFlying?"gold":"lightgreen",this.shadowColor=this.isFlying?"rgba(255, 215, 0, 0.3)":"rgba(144, 238, 144, 0.3)",this.floatingSpeed=.01,this.floatingAmplitude=.8,this.isFlying&&(this.blinkInterval=500,this.lastBlink=0,this.isFlickering=!1,this.fleeingBlinkInterval=300,this.fleeingLastBlink=0,this.setRandomDirection(),this.baseSpeed=1,this.speed=this.baseSpeed*1.3,this.wobbleInterval=150,this.lastWobble=Date.now(),this.maxWanderDistance=150,this.initialPosition={...this.position})}setRandomDirection(){this.direction={x:Math.random()-.5,y:Math.random()-.5};let t=Math.sqrt(this.direction.x*this.direction.x+this.direction.y*this.direction.y);this.direction.x/=t,this.direction.y/=t}resetPosition(){this.position={x:Math.random()*(I-100)+50,y:Math.random()*(b-100)+50}}update(){if(this.isFlying){if(!this.fleeing){let e=Date.now();e-this.lastWobble>this.wobbleInterval&&(this.setRandomDirection(),this.lastWobble=e)}if(this.position.x+=this.direction.x*this.speed,this.position.y+=this.direction.y*this.speed,this.position.x<0&&(this.position.x=I),this.position.x>I&&(this.position.x=0),this.position.y<0&&(this.position.y=b),this.position.y>b&&(this.position.y=0),this.getDistance(this.initialPosition,this.position)>this.maxWanderDistance){let e=this.initialPosition.x-this.position.x,s=this.initialPosition.y-this.position.y,n=Math.sqrt(e*e+s*s);this.direction.x=e/n,this.direction.y=s/n,this.speed=this.baseSpeed}else this.speed=this.baseSpeed*1.3}}getDistance(t,e){let s=t.x-e.x,n=t.y-e.y;return Math.sqrt(s*s+n*n)}flee(t,e){if(this.isFlying&&!this.fleeing){let s=this.position.x-t.x,n=this.position.y-t.y,h=Math.sqrt(s*s+n*n);if(h<70){let a={x:s/h,y:n/h};this.direction=a,this.speed=this.baseSpeed*8,this.fleeing=!0,this.fleeingColor="yellow",this.size=12,setTimeout(()=>{this.speed=this.baseSpeed*1.3,this.fleeing=!1,this.fleeingColor="red",this.size=9},Math.random()*1500+500)}}}draw(){let t=0;if(!this.isFlying){let n=Date.now()*this.floatingSpeed;t=Math.sin(n+this.position.y)*this.floatingAmplitude}let e=this.position.x-p.x,s=this.position.y-p.y+t;if(e>=-10&&e<=N+10&&s>=-10&&s<=L+10&&(this.isFlying||(i.shadowColor="white",i.shadowBlur=32,i.fillStyle="white",i.globalAlpha=.8,i.beginPath(),i.arc(e,s,this.size*.8,0,Math.PI*2),i.fill(),i.globalAlpha=1,i.shadowColor="transparent",i.shadowBlur=0,i.shadowColor=this.shadowColor,i.shadowBlur=64,i.globalAlpha=.5,i.fillStyle=this.color,i.beginPath(),i.arc(e,s,this.size*1.2,0,Math.PI*2),i.fill(),i.globalAlpha=1,i.shadowColor="transparent",i.shadowBlur=0,i.fillStyle=this.color,i.globalAlpha=.9,i.beginPath(),i.arc(e,s,this.size,0,Math.PI*2),i.fill(),i.globalAlpha=1),this.isFlying)){let n=this.fleeing?this.fleeingBlinkInterval:this.blinkInterval,h=this.fleeingLastBlink||this.lastBlink,a=this.fleeing?6:5,r=this.size*1.1,l=Date.now();l-h>=n&&(this.fleeing?this.fleeingLastBlink=l:this.lastBlink=l),i.fillStyle="white",i.globalAlpha=.95,i.beginPath(),i.arc(e,s,r*.3,0,Math.PI*2),i.fill(),i.globalAlpha=1,i.shadowColor=this.shadowColor,i.shadowBlur=r*a*.8,i.fillStyle=this.color,i.globalAlpha=.7,i.beginPath(),i.arc(e,s,r*.6,0,Math.PI*2),i.fill(),i.globalAlpha=1,i.shadowColor="transparent",i.shadowBlur=0,i.shadowColor=this.shadowColor,i.shadowBlur=r*a*1.2,i.fillStyle=this.color,i.globalAlpha=.5,i.beginPath(),i.arc(e,s,r*.9,0,Math.PI*2),i.fill(),i.globalAlpha=1,i.shadowColor="transparent",i.shadowBlur=0,i.fillStyle=this.color,i.globalAlpha=.9,i.beginPath(),i.arc(e,s,r,0,Math.PI*2),i.fill(),i.globalAlpha=1}}};function Y(){return J[Math.floor(Math.random()*J.length)]}function tt(o,t,e){return o+(t-o)*e}function gt(o,t,e){let s=(t-o+360)%360;return s>180&&(s-=360),o+s*e}var p={x:0,y:0,update:function(o,t){let s=o-N/2,n=t-L/2;this.x+=(s-this.x)*.1,this.y+=(n-this.y)*.1}};function ot(o,t,e,s){let n;do n=Q[Math.floor(Math.random()*Q.length)];while(G.isNameTaken(n,s));let h=Math.random()*I,a=Math.random()*b;return new G(h,a,e,!0,n)}var X=[],E=[],y=new G(S.width/2,S.height/2,"#4444ff",!1,"Player");E.push(y);var it=y.findSafeSpawnPosition();y.reset(it.x,it.y);for(let o=0;o<rt;o++){let t=ot(Math.random()*S.width,Math.random()*S.height,Y(),E);X.push(t),E.push(t)}var _=Array(at).fill(null).map(()=>new R),dt=9e3;setInterval(()=>{Math.random()<.4&&_.push(new R(!0))},dt);document.addEventListener("mousemove",o=>{if(!y.isAlive||y.isDying)return;let t=o.clientX-S.offsetLeft+p.x,e=o.clientY-S.offsetTop+p.y,s=y.segments[0],n=t-s.x,h=e-s.y,a={x:n,y:h},r=Math.sqrt(a.x*a.x+a.y*a.y);r>0?(a.x/=r,a.y/=r):a={x:1,y:0};let l=.5;y.targetDirection.x=tt(y.targetDirection.x,a.x,l),y.targetDirection.y=tt(y.targetDirection.y,a.y,l)});document.addEventListener("keydown",o=>{o.code==="Space"&&y.isAlive&&y.canSpeedBoost()&&(y.isSpeedingUp=!0,y.lastSpeedBoostTime=Date.now())});document.addEventListener("keyup",o=>{o.code==="Space"&&(y.isSpeedingUp=!1)});document.addEventListener("mousedown",o=>{o.button===0&&y.isAlive&&y.canSpeedBoost()&&(y.isSpeedingUp=!0)});document.addEventListener("mouseup",o=>{o.button===0&&(y.isSpeedingUp=!1)});function ft(o){let t=null,e=1/0,s=st(o);return ct.forEach(n=>{let h=st(n),a=yt(s,h);a<e&&(e=a,t=n)}),t}function st(o){let t=parseInt(o.slice(1,3),16),e=parseInt(o.slice(3,5),16),s=parseInt(o.slice(5,7),16);return{r:t,g:e,b:s}}function yt(o,t){return Math.sqrt(.3*Math.pow(o.r-t.r,2)+.59*Math.pow(o.g-t.g,2)+.11*Math.pow(o.b-t.b,2))}function mt(){E.forEach(o=>{if(!o.isAlive||o.isDying)return;let t=o.segments[0];if(t.x<=0||t.x>=I||t.y<=0||t.y>=b){et(o);return}let e=o.direction;for(let s=_.length-1;s>=0;s--){let n=_[s];n.isFlying&&!n.fleeing&&n.flee(t,e);let h=t.x-n.position.x,a=t.y-n.position.y;if(Math.sqrt(h*h+a*a)<o.size+n.size){_.splice(s,1);let l=Math.random()<.1,c=Date.now();_.length<ht&&c-j>=lt&&(_.push(new R(l)),j=c),o.segments.length<o.MAX_LENGTH&&o.grow(n.value),o.foodEaten+=n.value*.2;break}}});for(let o=0;o<E.length;o++){let t=E[o];if(!t.isAlive||t.isDying)continue;let e=t.segments[0];for(let s=0;s<E.length;s++){let n=E[s];if(!(t===n||!n.isAlive||n.isDying))for(let h=0;h<n.segments.length;h++){let a=n.segments[h],r=e.x-a.x,l=e.y-a.y,c=Math.sqrt(r*r+l*l),g=h===0?n.size:n.size*.8;if(c<t.size+g*.7){et(t);return}}}}}function et(o){if(o.lives=Math.max(0,o.lives-1),o.isDying=!0,o.deathProgress=0,o.lives<=0){let t=[...o.segments],e=2.5,s=ft(o.color);t.forEach(a=>{let r=Math.random()*2*Math.PI,l=Math.random()*o.size*e,c=a.x+l*Math.cos(r),g=a.y+l*Math.sin(r),d=new R;d.color=s,d.position={x:c,y:g},_.push(d)});let n=X.indexOf(o);n!==-1&&X.splice(n,1);let h=E.indexOf(o);if(h!==-1&&E.splice(h,1),o.isBot){let a=Math.random()*S.width,r=Math.random()*S.height,l=ot(a,r,pt(),E);E.push(l),X.push(l)}}}function pt(){let o=Math.floor(Math.random()*256),t=Math.floor(Math.random()*256),e=Math.floor(Math.random()*256);return`rgb(${o}, ${t}, ${e})`}function ut(){P.innerHTML=E.map(t=>{let e="";return t.isAlive&&!t.isDying?e='<span class="active-indicator"></span>':t.lives>0&&(e='<span class="respawning-indicator">|</span>'),`
                <div class="player-stats">
                    <strong>${t.name}</strong>: 
                    ${t.lives} ${t.lives===1?"life":"lives"} | 
                    ${t.segments.length}/${t.getCurrentMaxLength()} |
                    ${e} 
                </div>
            `}).join(""),document.querySelectorAll(".respawning-indicator").forEach(t=>{let e=0,s=setInterval(()=>{e+=5,t.style.transform=`rotate(${e}deg)`,e>=360&&(e=0)},20)}),P.style.position="absolute",P.style.top="56px",P.style.left="1058px",P.style.color="white",P.style.fontSize="12px",P.style.fontFamily="sans-serif",P.style.pointerEvents="none",P.style.zIndex="100",P.style.opacity="10"}function St(){w.clearRect(0,0,z.width,z.height);let o=Math.min(z.width/I,z.height/b);_.forEach(r=>{let l=r.position.x*o,c=r.position.y*o;w.fillStyle=r.isFlying?"gold":"lightgreen",w.beginPath(),w.arc(l,c,1,0,Math.PI*2),w.fill()});let t=y.segments[0].x*o,e=y.segments[0].y*o;w.fillStyle=y.color,w.beginPath(),w.arc(t,e,2,0,Math.PI*2),w.fill();let s=p.x*o,n=p.y*o,h=N*o,a=L*o;w.strokeStyle="white",w.lineWidth=1,w.strokeRect(s,n,h,a)}function xt(o){ut();let t=[...E];y.isAlive&&p.update(y.segments[0].x,y.segments[0].y),i.clearRect(0,0,N,L),i.strokeStyle="#FF4444",i.lineWidth=4,i.strokeRect(-p.x,-p.y,I,b),i.strokeStyle="#333333",i.lineWidth=1;let e=100,s=Math.floor(p.x/e)*e,n=Math.floor(p.y/e)*e;for(let h=s;h<p.x+N+e;h+=e)h>=0&&h<=I&&(i.beginPath(),i.moveTo(h-p.x,0),i.lineTo(h-p.x,L),i.stroke());for(let h=n;h<p.y+L+e;h+=e)h>=0&&h<=b&&(i.beginPath(),i.moveTo(0,h-p.y),i.lineTo(N,h-p.y),i.stroke());_.forEach(h=>{h.update(),h.draw()}),t.forEach(h=>{h.update(_,t,o),h.draw()}),mt()}var nt=performance.now();function q(){i.clearRect(0,0,S.width,S.height),St();let o=performance.now(),t=(o-nt)/1e3;t=Math.min(t,1/30),xt(t),y.lives<=0?(i.fillStyle="rgba(0, 0, 0, 0.5)",i.fillRect(0,0,S.width,S.height),i.fillStyle="white",i.font="30px Arial",i.textAlign="center",i.textBaseline="middle",i.fillText("Game Over!",S.width/2,S.height/2),cancelAnimationFrame(q)):(nt=o,requestAnimationFrame(q))}q();})();
