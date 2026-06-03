import { readFile, writeFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import potraceModule from 'potrace'
const { trace } = potraceModule
const __dirname = dirname(fileURLToPath(import.meta.url))

function rgbToLab(r,g,b){r/=255;g/=255;b/=255;r=r>0.04045?Math.pow((r+0.055)/1.055,2.4):r/12.92;g=g>0.04045?Math.pow((g+0.055)/1.055,2.4):g/12.92;b=b>0.04045?Math.pow((b+0.055)/1.055,2.4):b/12.92;let X=(r*0.4124564+g*0.3575761+b*0.1804375)/0.95047,Y=(r*0.2126729+g*0.7151522+b*0.0721750),Z=(r*0.0193339+g*0.1191920+b*0.9503041)/1.08883;const f=t=>t>0.008856?Math.pow(t,1/3):7.787*t+16/116;return[116*f(Y)-16,500*(f(X)-f(Y)),200*(f(Y)-f(Z))]}

function kmeans(px,K,maxIt){const N=px.length/3;const c=new Float32Array(K*3);let idx=Math.floor(Math.random()*N)*3;c[0]=px[idx];c[1]=px[idx+1];c[2]=px[idx+2];for(let k=1;k<K;k++){const d=new Float32Array(N);let td=0;for(let i=0;i<N;i++){let md=Infinity;const l=px[i*3],a=px[i*3+1],b=px[i*3+2];for(let kk=0;kk<k;kk++){const dl=l-c[kk*3],da=a-c[kk*3+1],db=b-c[kk*3+2];const dd=dl*dl+da*da+db*db;if(dd<md)md=dd}d[i]=md;td+=md}let p=Math.random()*td;for(let i=0;i<N;i++){p-=d[i];if(p<=0){c[k*3]=px[i*3];c[k*3+1]=px[i*3+1];c[k*3+2]=px[i*3+2];break}}}const lb=new Uint8Array(N);for(let it=0;it<maxIt;it++){let ch=0;for(let i=0;i<N;i++){const l=px[i*3],a=px[i*3+1],b=px[i*3+2];let best=0,bd=Infinity;for(let k=0;k<K;k++){const dl=l-c[k*3],da=a-c[k*3+1],db=b-c[k*3+2];const d=dl*dl+da*da+db*db;if(d<bd){bd=d;best=k}}if(lb[i]!==best){lb[i]=best;ch++}}if(!ch)break;const s=new Float64Array(K*3);const cnt=new Uint32Array(K);for(let i=0;i<N;i++){const k=lb[i];s[k*3]+=px[i*3];s[k*3+1]+=px[i*3+1];s[k*3+2]+=px[i*3+2];cnt[k]++}for(let k=0;k<K;k++){if(!cnt[k])continue;c[k*3]=s[k*3]/cnt[k];c[k*3+1]=s[k*3+1]/cnt[k];c[k*3+2]=s[k*3+2]/cnt[k]}}return lb}

async function genSketch(name, K, tol, turdSize, alphaMax) {
  process.stdout.write(`${name}... `)
  const {data,info} = await sharp(join(__dirname,'..','public','paintings',name+'.jpg')).resize(600).median(5).raw().toBuffer({resolveWithObject:true})
  const W=info.width, H=info.height, ch=info.channels
  const px=new Float32Array(W*H*3)
  for(let i=0;i<W*H;i++){const [L,a,b]=rgbToLab(data[i*ch],data[i*ch+1],data[i*ch+2]);px[i*3]=L;px[i*3+1]=a;px[i*3+2]=b}
  const lb=kmeans(px,K,15)
  const edges=new Uint8Array(W*H)
  for(let y=1;y<H-1;y++)for(let x=1;x<W-1;x++){const i=y*W+x;if(lb[i]!==lb[i-1]||lb[i]!==lb[i+1]||lb[i]!==lb[i-W]||lb[i]!==lb[i+W])edges[i]=1}
  const v=new Uint8Array(W*H)
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const s=y*W+x;if(!edges[s]||v[s])continue;const st=[s],co=[];v[s]=1;while(st.length){const p=st.pop();co.push(p);const px2=p%W,py=(p-px2)/W;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const nx=px2+dx,ny=py+dy;if(nx<0||ny<0||nx>=W||ny>=H)continue;const n=ny*W+nx;if(edges[n]&&!v[n]){v[n]=1;st.push(n)}}}if(co.length<60)for(const p of co)edges[p]=0}
  const di=new Uint8Array(W*H)
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=y*W+x;if(edges[i]){di[i]=1;continue}if(x>0&&edges[i-1])di[i]=1;else if(x<W-1&&edges[i+1])di[i]=1;else if(y>0&&edges[i-W])di[i]=1;else if(y<H-1&&edges[i+W])di[i]=1}
  const bmp=new Uint8Array(W*H*4).fill(255)
  for(let i=0;i<W*H;i++)if(di[i]){bmp[i*4]=0;bmp[i*4+1]=0;bmp[i*4+2]=0}
  const png=await sharp(Buffer.from(bmp),{raw:{width:W,height:H,channels:4}}).png().toBuffer()
  const svg=await new Promise((res,rej)=>trace(png,{turdSize,turnPolicy:'minority',alphaMax,optCurve:true,optTolerance:tol,threshold:128,blackOnWhite:true,color:'#1A1A1A',background:'transparent'},(e,s)=>e?rej(e):res(s)))
  const clean=svg.replace(/<svg([^>]*) width="[^"]*"/,'<svg$1').replace(/(<svg[^>]*) height="[^"]*"/,'$1').replace(/<svg([^>]*)>/,'<svg$1 preserveAspectRatio="xMidYMid meet">')
  await writeFile(join(__dirname,'..','public','sketches',name+'.svg'),clean)
  console.log('✓')
}

await genSketch('klee',     8, 0.5, 10, 1.2)
await genSketch('delaunay', 6, 0.8, 14, 1.3)
await genSketch('doesburg', 5, 1.0, 18, 1.34)
console.log('Tots llestos!')
