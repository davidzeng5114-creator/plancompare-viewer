/* Local, dependency-free, store-only ZIP for review bundles and Word documents. */
(function (root) {
  'use strict';
  const enc = new TextEncoder(), dec = new TextDecoder('utf-8', {fatal:true});
  const table = new Uint32Array(256);
  for (let n=0; n<256; n++) {let c=n; for(let k=0;k<8;k++) c=(c&1)?(0xedb88320^(c>>>1)):(c>>>1); table[n]=c>>>0;}
  function bytes(value) {if(value instanceof Uint8Array)return value; if(value instanceof ArrayBuffer)return new Uint8Array(value); throw Error('ZIP data must be Uint8Array or ArrayBuffer.');}
  function crc32(value) {const b=bytes(value); let c=0xffffffff; for(let i=0;i<b.length;i++)c=table[(c^b[i])&255]^(c>>>8);return(c^0xffffffff)>>>0;}
  function path(name) {
    if(typeof name!=='string'||!name||name.length>240||name.includes('\\')||/[:\x00-\x1f\x7f]/.test(name)||name.startsWith('/')||name.endsWith('/')||name.split('/').some(s=>!s||s==='.'||s==='..'))throw Error('Unsafe ZIP entry name.');
    return name;
  }
  function create(files) {
    if(!Array.isArray(files)||files.length>65534)throw Error('Invalid ZIP entries.');
    const names=new Set(), items=[]; let total=22, offset=0;
    for(const f of files) {const name=path(f.name);if(names.has(name))throw Error('Duplicate ZIP entry.');names.add(name);const n=enc.encode(name),data=bytes(f.data);if(n.length>65535||data.length>=0xffffffff)throw Error('ZIP64 is unsupported.');const item={n,data,crc:crc32(data),offset};items.push(item);offset+=30+n.length+data.length;total+=76+2*n.length+data.length;if(total>=0xffffffff)throw Error('ZIP64 is unsupported.');}
    const out=new Uint8Array(total),v=new DataView(out.buffer);let p=0;
    for(const f of items) {v.setUint32(p,0x04034b50,true);v.setUint16(p+4,20,true);v.setUint16(p+6,0x800,true);v.setUint16(p+8,0,true);v.setUint16(p+12,33,true);v.setUint32(p+14,f.crc,true);v.setUint32(p+18,f.data.length,true);v.setUint32(p+22,f.data.length,true);v.setUint16(p+26,f.n.length,true);out.set(f.n,p+30);out.set(f.data,p+30+f.n.length);p+=30+f.n.length+f.data.length;}
    const central=p;
    for(const f of items) {v.setUint32(p,0x02014b50,true);v.setUint16(p+4,20,true);v.setUint16(p+6,20,true);v.setUint16(p+8,0x800,true);v.setUint16(p+10,0,true);v.setUint16(p+14,33,true);v.setUint32(p+16,f.crc,true);v.setUint32(p+20,f.data.length,true);v.setUint32(p+24,f.data.length,true);v.setUint16(p+28,f.n.length,true);v.setUint32(p+42,f.offset,true);out.set(f.n,p+46);p+=46+f.n.length;}
    v.setUint32(p,0x06054b50,true);v.setUint16(p+8,items.length,true);v.setUint16(p+10,items.length,true);v.setUint32(p+12,p-central,true);v.setUint32(p+16,central,true);return out;
  }
  function read(value, options={}) {
    const b=bytes(value),maxTotalBytes=options.maxTotalBytes??350*1024*1024,maxEntries=options.maxEntries??6000;
    if(!Number.isSafeInteger(maxTotalBytes)||maxTotalBytes<0||!Number.isSafeInteger(maxEntries)||maxEntries<0)throw Error('Invalid ZIP limits.');
    if(b.length<22||b.length>maxTotalBytes)throw Error('ZIP is empty, truncated or exceeds the size limit.');
    const v=new DataView(b.buffer,b.byteOffset,b.byteLength),end=b.length-22;
    if(v.getUint32(end,true)!==0x06054b50||v.getUint16(end+20,true)!==0)throw Error('Unsupported or truncated ZIP ending.');
    if(v.getUint16(end+4,true)!==0||v.getUint16(end+6,true)!==0)throw Error('Multi-disk ZIP is unsupported.');
    const count=v.getUint16(end+10,true),start=v.getUint32(end+16,true),centralSize=v.getUint32(end+12,true);
    if(count===65535||count>maxEntries||v.getUint16(end+8,true)!==count||start+centralSize!==end)throw Error('Invalid ZIP directory or entry limit.');
    const output=new Map(),ranges=[];let p=start,total=0;
    function bound(offset,length,limit=b.length){if(!Number.isSafeInteger(offset)||!Number.isSafeInteger(length)||offset<0||length<0||offset+length>limit)throw Error('Truncated ZIP entry.');}
    function filename(offset,length,flags) {bound(offset,length);const raw=b.subarray(offset,offset+length);if(!(flags&0x800)&&raw.some(c=>c>127))throw Error('ZIP filenames require UTF-8.');return path(dec.decode(raw));}
    for(let i=0;i<count;i++) {
      bound(p,46,end);if(v.getUint32(p,true)!==0x02014b50)throw Error('Invalid ZIP directory entry.');
      const flags=v.getUint16(p+8,true),method=v.getUint16(p+10,true),crc=v.getUint32(p+16,true),compressed=v.getUint32(p+20,true),size=v.getUint32(p+24,true),n=v.getUint16(p+28,true),extra=v.getUint16(p+30,true),comment=v.getUint16(p+32,true),disk=v.getUint16(p+34,true),attrs=v.getUint32(p+38,true),offset=v.getUint32(p+42,true);
      if(flags&~0x800||method!==0||compressed!==size||size===0xffffffff||offset===0xffffffff||disk!==0)throw Error('Only unencrypted store-only ZIP entries are supported.');
      if(((attrs>>>16)&0xf000)===0xa000)throw Error('ZIP symbolic links are unsupported.');
      bound(p,46+n+extra+comment,end);const name=filename(p+46,n,flags);if(output.has(name))throw Error('Duplicate ZIP entry.');
      total+=size;if(total>maxTotalBytes)throw Error('ZIP contents exceed the size limit.');
      bound(offset,30,start);if(v.getUint32(offset,true)!==0x04034b50)throw Error('Invalid ZIP local header.');
      const ln=v.getUint16(offset+26,true),le=v.getUint16(offset+28,true),dataStart=offset+30+ln+le;
      bound(offset,30+ln+le+size,start);
      if(v.getUint16(offset+6,true)!==flags||v.getUint16(offset+8,true)!==method||v.getUint32(offset+14,true)!==crc||v.getUint32(offset+18,true)!==size||v.getUint32(offset+22,true)!==size||filename(offset+30,ln,flags)!==name)throw Error('ZIP headers disagree.');
      const data=b.subarray(dataStart,dataStart+size);if(crc32(data)!==crc)throw Error('ZIP checksum mismatch.');output.set(name,data);ranges.push([offset,dataStart+size]);p+=46+n+extra+comment;
    }
    if(p!==end)throw Error('ZIP directory has unexpected trailing bytes.');
    ranges.sort((a,c)=>a[0]-c[0]);let covered=0;for(const range of ranges){if(range[0]!==covered)throw Error('ZIP entries overlap or contain unexpected bytes.');covered=range[1];}if(covered!==start)throw Error('ZIP contents do not match its directory.');
    return output;
  }
  const api=Object.freeze({create,read,crc32,validatePath:path});root.PlanCompareZip=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
