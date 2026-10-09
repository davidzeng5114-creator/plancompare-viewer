/* Review data is read locally. No input HTML or remote URLs are executed. */
(function(root){
  'use strict';const decoder=new TextDecoder('utf-8',{fatal:true}),plain=x=>x&&typeof x==='object'&&!Array.isArray(x);
  function validatePage(page,entries) {
    const data=page.data;if(!plain(data)||!Array.isArray(data.page_size_pt)||data.page_size_pt.length!==2||data.page_size_pt.some(n=>!Number.isFinite(n)||n<=0||n>20000))throw Error('Invalid drawing page size.');
    const issues=data.intelligent_review?.issues;if(!Array.isArray(issues)||issues.length>10000)throw Error('Invalid review issue list.');
    const ids=new Set();for(const issue of issues){if(!plain(issue)||typeof issue.id!=='string'||!issue.id||issue.id.length>200||ids.has(issue.id))throw Error('Invalid or duplicate review issue ID.');ids.add(issue.id);if(issue.bbox_pt&&(!Array.isArray(issue.bbox_pt)||issue.bbox_pt.length!==4||issue.bbox_pt.some(x=>!Number.isFinite(x))))throw Error('Invalid issue coordinates.');}
    if(!plain(page.assets)||Object.keys(page.assets).length>5999)throw Error('Invalid review asset manifest.');
    const assetSpecs=[];
    for(const [relative,name]of Object.entries(page.assets)){
      root.PlanCompareZip.validatePath(relative);root.PlanCompareZip.validatePath(name);if(!name.startsWith('assets/')||!(/\.(png|jpe?g)$/i.test(relative)&&/\.(png|jpe?g)$/i.test(name)))throw Error('Review assets must be bundled PNG or JPEG images.');
      const value=entries.get(name);if(!value)throw Error('Missing review image: '+relative);let type;
      if(value.length>=8&&[137,80,78,71,13,10,26,10].every((n,i)=>value[i]===n))type='image/png';else if(value.length>=3&&value[0]===255&&value[1]===216&&value[2]===255)type='image/jpeg';else throw Error('Invalid review image: '+relative);
      assetSpecs.push({relative,data:value,type});
    }
    const keys=new Set(assetSpecs.map(x=>x.relative));for(const i of issues){if(i.evidence_image&&!keys.has(i.evidence_image))throw Error('Missing issue evidence image: '+i.evidence_image);}
    if(!keys.has('new_preview.png')&&!keys.has('aligned_preview.png')&&!keys.has('new_aligned.png'))throw Error('Missing drawing preview.');
    const documentSpecs=[];
    if(page.documents!==undefined){
      if(!plain(page.documents)||Object.keys(page.documents).length>3)throw Error('Invalid native PDF document manifest.');
      const names=new Set();
      for(const[relative,name]of Object.entries(page.documents)){
        root.PlanCompareZip.validatePath(relative);root.PlanCompareZip.validatePath(name);
        if(!['old.pdf','new.pdf','annotated.pdf'].includes(relative)||!name.startsWith('documents/')||!/\.pdf$/i.test(name)||names.has(name))throw Error('Native PDF documents must use unique bundled PDF paths.');
        names.add(name);const value=entries.get(name);
        if(!value)throw Error('Missing native PDF document: '+relative);
        if(value.length>120*1024*1024)throw Error('Native PDF document exceeds 120 MiB: '+relative);
        if(value.length<5||![37,80,68,70,45].every((n,i)=>value[i]===n))throw Error('Invalid native PDF header: '+relative);
        documentSpecs.push({relative,data:value,type:'application/pdf'});
      }
    }
    return{data,assetSpecs,documentSpecs,ids};
  }
  function validate(entries) {
    const raw=entries.get('manifest.json');if(!raw||raw.length>32*1024*1024)throw Error('Missing or oversized review manifest.');
    let manifest;try{manifest=JSON.parse(decoder.decode(raw));}catch(e){throw Error('Invalid review manifest JSON.');}
    if(!plain(manifest)||manifest.format!=='plancompare-review'||String(manifest.version)!=='1')throw Error('Unsupported review bundle format.');
    const first=validatePage(manifest,entries),pages=[],ids=new Set(first.ids);
    if(manifest.pages!==undefined){
      if(!Array.isArray(manifest.pages)||manifest.pages.length<1||manifest.pages.length>32)throw Error('Review bundles must contain 1 to 32 pages.');
      const pageIds=new Set(),issueIds=new Set(),paths=new Set();
      for(const page of manifest.pages){
        if(!plain(page)||typeof page.id!=='string'||!page.id||page.id.length>200||pageIds.has(page.id))throw Error('Invalid or duplicate sheet page ID.');
        for(const key of ['sheet_number','sheet_name','view_name'])if(typeof page[key]!=='string'||page[key].length>500)throw Error('Invalid sheet page label.');
        pageIds.add(page.id);const validated=validatePage(page,entries);
        for(const id of validated.ids){if(issueIds.has(id))throw Error('Review issue IDs must be globally unique across pages.');issueIds.add(id);ids.add(id);}
        if(issueIds.size>10000)throw Error('Invalid review issue list: more than 10000 issues across pages.');
        const pagePaths=new Set([...Object.values(page.assets),...Object.values(page.documents||{})]);
        for(const name of pagePaths){if(paths.has(name))throw Error('Sheet pages must use distinct bundled asset and document paths.');paths.add(name);}
        pages.push({id:page.id,sheet_number:page.sheet_number,sheet_name:page.sheet_name,view_name:page.view_name,...validated});
      }
      if(first.ids.size!==pages[0].ids.size||[...first.ids].some(id=>!pages[0].ids.has(id)))throw Error('The legacy root issue list must alias the first sheet page.');
    }
    const reviews={};if(manifest.reviews!==undefined&&!plain(manifest.reviews))throw Error('Invalid review statuses.');for(const[id,status]of Object.entries(manifest.reviews||{})){if(ids.has(id)){if(!['pending','confirmed','ignored'].includes(status))throw Error('Invalid review status.');reviews[id]=status;}}
    const metadata=plain(manifest.metadata)?manifest.metadata:{};return{manifest,data:first.data,assetSpecs:first.assetSpecs,documentSpecs:first.documentSpecs,pages,reviews,metadata};
  }
  function load(bytes){return validate(root.PlanCompareZip.read(bytes,{maxTotalBytes:350*1024*1024,maxEntries:6000}));}
  function materialize(review){
    const urls=[],cache=new Map();
    const payload=page=>{const assets={},documents={};for(const[item,target]of [...page.assetSpecs.map(x=>[x,assets]),...(page.documentSpecs||[]).map(x=>[x,documents])]){let url=cache.get(item.data);if(!url){url=URL.createObjectURL(new Blob([item.data],{type:item.type}));cache.set(item.data,url);urls.push(url);}target[item.relative]=url;}
      return{...page.data,viewer_only:true,assets,documents,reviews:{...review.reviews},review_statuses:{...review.reviews},metadata:review.metadata,report_metadata:{...page.data.report_metadata,...review.metadata}};};
    const data=payload(review),pages=(review.pages||[]).map(page=>({id:page.id,sheet_number:page.sheet_number,sheet_name:page.sheet_name,view_name:page.view_name,data:{...payload(page),viewer_page_id:page.id,viewer_sheet_number:page.sheet_number,viewer_sheet_name:page.sheet_name,viewer_view_name:page.view_name,viewer_page_count:review.pages.length}}));
    return{data,pages,dispose:()=>urls.forEach(u=>URL.revokeObjectURL(u))};
  }
  function safeJSON(value){return JSON.stringify(value).replace(/</g,'\\u003c').replace(/\u2028/g,'\\u2028').replace(/\u2029/g,'\\u2029');}
  function injectData(template,data){if(typeof template!=='string'||template.split('__DATA__').length!==2)throw Error('Invalid fixed review template.');return template.replace('__DATA__',()=>safeJSON(data));}
  const api=Object.freeze({validate,load,materialize,safeJSON,injectData});root.PlanCompareBundle=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof globalThis!=='undefined'?globalThis:window);
