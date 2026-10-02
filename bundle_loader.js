/* Review data is read locally. No input HTML or remote URLs are executed. */
(function(root){
  'use strict';const decoder=new TextDecoder('utf-8',{fatal:true}),plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
  function validate(entries) {
    const raw=entries.get('manifest.json');if(!raw||raw.length>32*1024*1024)throw Error('Missing or oversized review manifest.');
    let manifest;try{manifest=JSON.parse(decoder.decode(raw));}catch(e){throw Error('Invalid review manifest JSON.');}
    if(!plain(manifest)||manifest.format!=='plancompare-review'||String(manifest.version)!=='1')throw Error('Unsupported review bundle format.');
    const data=manifest.data;if(!plain(data)||!Array.isArray(data.page_size_pt)||data.page_size_pt.length!==2||data.page_size_pt.some(n=>!Number.isFinite(n)||n<=0||n>20000))throw Error('Invalid drawing page size.');
    const issues=data.intelligent_review?.issues;if(!Array.isArray(issues)||issues.length>10000)throw Error('Invalid review issue list.');
    const ids=new Set();for(const issue of issues){if(!plain(issue)||typeof issue.id!=='string'||!issue.id||issue.id.length>200||ids.has(issue.id))throw Error('Invalid or duplicate review issue ID.');ids.add(issue.id);if(issue.bbox_pt&&(!Array.isArray(issue.bbox_pt)||issue.bbox_pt.length!==4||issue.bbox_pt.some(x=>!Number.isFinite(x))))throw Error('Invalid issue coordinates.');}
    if(!plain(manifest.assets)||Object.keys(manifest.assets).length>5999)throw Error('Invalid review asset manifest.');
    const assetSpecs=[];
    for(const [relative,name]of Object.entries(manifest.assets)){
      root.PlanCompareZip.validatePath(relative);root.PlanCompareZip.validatePath(name);if(!name.startsWith('assets/')||!(/\.(png|jpe?g)$/i.test(relative)&&/\.(png|jpe?g)$/i.test(name)))throw Error('Review assets must be bundled PNG or JPEG images.');
      const value=entries.get(name);if(!value)throw Error('Missing review image: '+relative);let type;
      if(value.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>value[i]===n))type='image/png';else if(value.length>=3&&value[0]===255&&value[1]===216&&value[2]===255)type='image/jpeg';else throw Error('Invalid review image: '+relative);
      assetSpecs.push({relative,data:value,type});
    }
    const keys=new Set(assetSpecs.map(x=>x.relative));for(const i of issues){if(i.evidence_image&&!keys.has(i.evidence_image))throw Error('Missing issue evidence image: '+i.evidence_image);}
    if(!keys.has('new_preview.png')&&!keys.has('aligned_preview.png')&&!keys.has('new_aligned.png'))throw Error('Missing drawing preview.');
    const reviews={};if(manifest.reviews!==undefined&&!plain(manifest.reviews))throw Error('Invalid review statuses.');for(const[id,status]of Object.entries(manifest.reviews||{})){if(ids.has(id)){if(!['pending','confirmed','ignored'].includes(status))throw Error('Invalid review status.');reviews[id]=status;}}
    const metadata=plain(manifest.metadata)?manifest.metadata:{};return{manifest,data,assetSpecs,reviews,metadata};
  }
  function load(bytes){return validate(root.PlanCompareZip.read(bytes,{maxTotalBytes:350*1024*1024,maxEntries:6000}));}
  function materialize(review){const urls=[],assets={};for(const item of review.assetSpecs){const url=URL.createObjectURL(new Blob([item.data],{type:item.type}));urls.push(url);assets[item.relative]=url;}return{data:{...review.data,viewer_only:true,assets,reviews:review.reviews,review_statuses:review.reviews,metadata:review.metadata,report_metadata:{...review.data.report_metadata,...review.metadata}},dispose:()=>urls.forEach(u=>URL.revokeObjectURL(u))};}
  function safeJSON(value){return JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
  function injectData(template,data){if(typeof template!=='string'||template.split('__DATA__').length!==2)throw Error('Invalid fixed review template.');return template.replace('__DATA__',()=>safeJSON(data));}
  const api=Object.freeze({validate,load,materialize,safeJSON,injectData});root.PlanCompareBundle=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
