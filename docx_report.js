/* Local, dependency-free Word report writer. No network, macros, or executable content. */
(function (root) {
  'use strict';
  const encode = s => new TextEncoder().encode(s);
  const xml = v => String(v ?? '').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\uFFFE\uFFFF]/g, '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
  const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
  const R = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships';
  const REL = 'http://schemas.openxmlformats.org/package/2006/relationships';
  const EMU = 914400;
  // Preserve the calendar date recorded by the source rather than converting its timezone.
  function dateOnly(value) {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})(?:$|[T ])/);
    if (!match) return '';
    const year=Number(match[1]), month=Number(match[2]), day=Number(match[3]);
    const leap=year%4===0 && (year%100!==0 || year%400===0);
    const days=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31];
    return year>0 && month>=1 && month<=12 && day>=1 && day<=days[month-1] ? match.slice(1,4).join('-') : '';
  }
  const typeNames = {
    WALL_ADDED: ['新增牆形構件', 'Wall shaped element added'], WALL_REMOVED: ['牆形構件移除', 'Wall shaped element removed'],
    WALL_SHIFTED: ['牆形邊界移位', 'Wall boundary shifted'], WALL_THICKNESS_CHANGED: ['牆形厚度改變', 'Wall thickness changed'],
    WALL_EXTENT_CHANGED: ['牆段長度改變', 'Wall extent changed'], WALL_OPENING_CHANGED: ['牆上開口改變', 'Wall opening changed'],
    WALL_BOUNDARY_CHANGED: ['牆邊界待確認', 'Wall boundary requires review'], MARK_CHANGED: ['Mark 內容改變', 'Mark content changed'],
    NUMBER_CHANGED: ['標註編號改變', 'Annotation number changed'], ANNOTATION_MOVED: ['標註位置改變', 'Annotation position changed'],
    UNCLASSIFIED_GEOMETRY: ['未分類圖形改變', 'Unclassified geometry change'], ANNOTATION_ADDED: ['標註新增', 'Annotation added'],
    ANNOTATION_REMOVED: ['標註移除', 'Annotation removed'], TEXT_CHANGED: ['文字內容改變', 'Text content changed'], TEXT_REPLACEMENT: ['文字內容替換', 'Text content replaced'],
    TEXT_ADDED: ['文字新增', 'Text added'], TEXT_REMOVED: ['文字移除', 'Text removed'], TEXT_MOVED: ['文字位置改變', 'Text position changed'],
    MODEL_ADDED: ['模型元素新增', 'Model element added'], MODEL_REMOVED: ['模型元素移除', 'Model element removed'], MODEL_DELETED: ['模型元素移除', 'Model element removed'],
    MODEL_MODIFIED: ['模型元素修改', 'Model element modified'], MODEL_CHANGED: ['模型元素改變', 'Model element changed'],
    MODEL_MOVED: ['模型元素移位', 'Model element moved'], MODEL_TYPE_CHANGED: ['模型型號改變', 'Model type changed'],
    MODEL_PARAMETER_CHANGED: ['模型參數改變', 'Model parameter changed'], MODEL_GEOMETRY_CHANGED: ['模型幾何改變', 'Model geometry changed'],
    MODEL_SCOPEENTERED: ['模型進入比較範圍', 'Model element entered comparison scope'], MODEL_SCOPEEXITED: ['模型退出比較範圍', 'Model element left comparison scope']
  };
  const categoryNames = { wall: ['牆體', 'Walls'], door: ['門', 'Doors'], window: ['窗', 'Windows'], mark: ['Mark 標記', 'Marks'], dimension: ['尺寸及數值', 'Dimensions and values'], text: ['文字及說明', 'Text and notes'], geometry: ['待識別圖形', 'Unclassified geometry'], annotation_movement: ['標註移位', 'Annotation movement'], context: ['其他待確認', 'Other items for review'] };
  const priorityNames = {important: ['主要變更', 'Major candidate'], check: ['待確認', 'Requires review'], minor: ['小變動', 'Minor candidate']};
  const statusNames = {pending: ['待核對', 'Pending review'], confirmed: ['已核對 保留', 'Reviewed and retained'], ignored: ['已忽略', 'Ignored']};
  const confidenceNames = { high: ['高', 'High'], medium: ['中', 'Medium'], low: ['低', 'Low'], unpaired: ['未配對', 'Unpaired'] };
  function label(zh, en, lang) { return lang === 'en' ? en : lang === 'bilingual' ? zh + ' / ' + en : zh; }
  function named(map, key, lang) { const v = map[key]; return v ? label(v[0], v[1], lang) : String(key || ''); }
  function length(runs) { return (runs || []).reduce((n, r) => n + Math.max(0, Number(r[1]) - Number(r[0])), 0); }
  function fallbackEnglish(issue, field) {
    if (modelIssue(issue)) {
      if (field === 'title' || field === 'what_changed') return named(typeNames, issue.kind, 'en') || 'Model element change';
      if (field === 'certainty') return 'Element data comes from exported model snapshots. Engineering impact remains subject to review.';
      if (field === 'location_hint') return 'See the captured model plan. Review the stated sheet mapping status.';
      if (field === 'description') return 'Review the element identifiers and earlier/later source field values recorded below.';
      if (field === 'why_it_matters' || field === 'next_action') return 'Review engineering and coordination implications, and verify the element location against the official drawing.';
      return String(issue[field] || '');
    }
    if (field === 'location_hint') {
      const parts = {圖面左上方:'Upper left of drawing',圖面左下方:'Lower left of drawing',圖面中上方:'Upper centre of drawing',圖面中下方:'Lower centre of drawing',圖面右上方:'Upper right of drawing',圖面右下方:'Lower right of drawing',圖面左部:'Left of drawing',圖面中部:'Centre of drawing',圖面右部:'Right of drawing'};
      return parts[issue.location_hint] || 'See highlighted drawing location';
    }
    const kinds = issue.change_types?.length ? issue.change_types : [issue.kind];
    const kindName = kinds.map(k => named(typeNames, k, 'en')).join('; ');
    if (field === 'title') {
      if (issue.category === 'dimension') {
        const values=String(issue.title || '').match(/[-+]?\d+(?:\.\d+)?/g) || [];
        return 'Numeric annotation' + (values.length ? ' ' + values.join(' to ') : ' changed');
      }
      if (issue.category === 'mark' && issue.title) {
        const tokens = String(issue.title).match(/[A-Za-z]+[A-Za-z0-9_./-]*|\b\d+\b/g) || [];
        return (kindName || 'Mark change') + (tokens.length ? ' ' + tokens.join(' ') : '');
      }
      return kindName || named(categoryNames, issue.category, 'en') + ' change';
    }
    if (field === 'certainty') return issue.category === 'wall'
      ? 'Wall shaped boundaries are inferred from drawing geometry. Element purpose and physical dimensions require verification.'
      : issue.category === 'annotation_movement' ? 'The annotation position changed; this alone does not establish movement of the physical element.'
      : issue.category === 'geometry' ? 'A geometric difference is visible. The element type and engineering significance are not confirmed.'
      : 'The source content and comparison evidence require architectural review before issue to the client.';
    if (field === 'why_it_matters') return issue.category === 'wall'
      ? 'Review the junctions, adjacent openings and coordinated work affected by this boundary change.'
      : 'Check the drawing references and related schedules before treating this candidate as an engineering change.';
    if (field === 'description' && issue.category === 'wall') {
      const g = issue.geometric_evidence || {}, a = g.old, b = g.new;
      const orientation = b?.orientation || a?.orientation;
      const orient = orientation === 'A' ? 'Inclined' : orientation === 'V' ? 'Vertical' : orientation === 'H' ? 'Horizontal' : 'Drawing';
      if (issue.kind === 'WALL_SHIFTED' && a && b) {
        const direction = orientation === 'A' ? 'normal to its axis' : orientation === 'V' ? (b.center > a.center ? 'to the right' : 'to the left') : (b.center > a.center ? 'downwards' : 'upwards');
        let s = orient + ' wall shaped boundaries shift ' + direction;
        if (Math.abs(b.thickness - a.thickness) > .5) s += b.thickness > a.thickness ? ' and become wider' : ' and become narrower';
        if (Math.abs(length(b.runs) - length(a.runs)) > 3) s += length(b.runs) > length(a.runs) ? '; the wall extent also increases' : '; the wall extent also decreases';
        return s + '. Red indicates old boundaries and blue indicates new boundaries.';
      }
      if (issue.kind === 'WALL_EXTENT_CHANGED' && a && b) return orient + ' wall shaped boundaries ' + (length(b.runs) > length(a.runs) ? 'extend' : 'shorten') + ' at the end. Review connections to adjoining walls and openings.';
      if (issue.kind === 'WALL_OPENING_CHANGED') return 'A gap within the wall shaped boundaries changes. It has not been confirmed as a doorway or another opening.';
      if (issue.kind === 'WALL_THICKNESS_CHANGED' && a && b) return 'The distance between the paired wall shaped boundaries ' + (b.thickness > a.thickness ? 'increases' : 'decreases') + '. Review the wall type and junction details.';
      if (issue.kind === 'WALL_ADDED') return 'A paired wall shaped boundary appears in the new drawing. Confirm the element type and purpose.';
      if (issue.kind === 'WALL_REMOVED') return 'A wall shaped boundary in the old drawing is absent in the corresponding new location. Confirm removal or a change in drawing representation.';
      return 'Part of a wall shaped boundary differs. The available evidence does not establish addition or removal of an entire wall.';
    }
    if (field === 'description') {
      if (issue.category === 'geometry') return 'Unclassified drawing geometry differs at the highlighted location. The comparison does not yet identify the physical element.';
      if (issue.category === 'annotation_movement') return 'The annotation content remains unchanged while its drawing position changes.';
      if (issue.category === 'mark') {
        const values=issue.native_mark_texts?.join(' ') || (String(issue.title || '').match(/[A-Za-z]+[A-Za-z0-9_./-]*|\b\d+\b/g) || []).join(' ');
        if (issue.kind === 'ANNOTATION_ADDED') return 'Annotation ' + values + ' appears in the new drawing. This alone does not establish addition of the physical door, window or other element.';
        if (issue.kind === 'ANNOTATION_REMOVED') return 'Annotation ' + values + ' is absent in the new drawing. This alone does not establish removal of the physical element.';
        return 'A mark or annotation identifier differs between the drawing versions' + (values ? ': '+values : '') + '. Check the corresponding door, window or element schedule.';
      }
      const evidence = issue.text_evidence || issue.source_text || {};
      const values = [issue.old_value || evidence.old, issue.new_value || evidence.new].filter(v => typeof v === 'string');
      if (!values.length && issue.category === 'dimension') values.push(...(String(issue.title || '').match(/[-+]?\d+(?:\.\d+)?/g) || []));
      return (issue.category === 'dimension' ? 'A dimension or numeric annotation differs. Its association with a physical dimension requires review.' : 'Drawing text or notes differ at the highlighted location.') + (values.length ? ' Source values: ' + values.join(' to ') + '.' : '');
    }
    return '';
  }
  function issueText(issue, field, lang) {
    const local = issue[field + '_en'];
    let en = typeof local === 'string' && local ? local : '';
    if (!en && root.PCStrings?.issueText) {
      const translated = root.PCStrings.issueText(issue, field, 'en');
      if (translated && !/[\u3400-\u9fff]/.test(translated)) en = translated;
    }
    en ||= fallbackEnglish(issue, field);
    const zh = String(issue[field] || (field === 'title' ? named(typeNames, issue.kind, 'zh') : ''));
    return lang === 'en' ? en : lang === 'bilingual' ? [zh, en].filter(Boolean).join('\n') : zh;
  }
  const CRC_TABLE = Array.from({length: 256}, (_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ (n >>> 1) : n >>> 1; return n >>> 0; });
  function crc32(bytes) { let n = 0xffffffff; for (const b of bytes) n = CRC_TABLE[(n ^ b) & 255] ^ (n >>> 8); return (n ^ 0xffffffff) >>> 0; }
  function zip(files) {
    const parts = [], central = []; let offset = 0;
    for (const [filename, content] of Object.entries(files)) {
      if (!/^[A-Za-z0-9_\[\]./-]+$/.test(filename) || filename.split('/').includes('..')) throw new Error('Unsafe OOXML member path');
      const name = encode(filename), bytes = typeof content === 'string' ? encode(content) : new Uint8Array(content);
      const crc = crc32(bytes), header = new Uint8Array(30 + name.length), dv = new DataView(header.buffer);
      dv.setUint32(0, 0x04034b50, true); dv.setUint16(4, 20, true); dv.setUint16(10, 0, true); dv.setUint16(12, 33, true);
      dv.setUint32(14, crc, true); dv.setUint32(18, bytes.length, true); dv.setUint32(22, bytes.length, true); dv.setUint16(26, name.length, true); header.set(name, 30);
      parts.push(header, bytes);
      const c = new Uint8Array(46 + name.length), cd = new DataView(c.buffer);
      cd.setUint32(0, 0x02014b50, true); cd.setUint16(4, 20, true); cd.setUint16(6, 20, true); cd.setUint16(14, 33, true);
      cd.setUint32(16, crc, true); cd.setUint32(20, bytes.length, true); cd.setUint32(24, bytes.length, true); cd.setUint16(28, name.length, true); cd.setUint32(42, offset, true); c.set(name, 46); central.push(c);
      offset += header.length + bytes.length;
    }
    const centralSize = central.reduce((n, v) => n + v.length, 0);
    const end = new Uint8Array(22), dv = new DataView(end.buffer);
    dv.setUint32(0, 0x06054b50, true); dv.setUint16(8, central.length, true); dv.setUint16(10, central.length, true); dv.setUint32(12, centralSize, true); dv.setUint32(16, offset, true);
    if (offset + centralSize > 512 * 1024 * 1024 || central.length > 65535) throw new Error('Word report exceeds local export limit');
    return new Blob([...parts, ...central, end], {type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'});
  }
  function imageInfo(bytes) {
    const b = new Uint8Array(bytes);
    if (b.length >= 24 && b[0] === 137 && b[1] === 80 && b[2] === 78 && b[3] === 71) {
      const v = new DataView(b.buffer, b.byteOffset, b.byteLength); return {ext: 'png', width: v.getUint32(16), height: v.getUint32(20)};
    }
    if (b.length >= 4 && b[0] === 255 && b[1] === 216) {
      let i = 2;
      while (i + 8 < b.length) {
        if (b[i++] !== 255) continue; let m = b[i++]; while (m === 255 && i < b.length) m = b[i++];
        if (m === 217 || m === 218) break; if (m === 1 || m >= 208 && m <= 215) continue;
        const size = b[i] * 256 + b[i + 1]; if (size < 2 || i + size > b.length) break;
        if ([192,193,194,195,197,198,199,201,202,203,205,206,207].includes(m)) return {ext:'jpg',height:b[i + 3] * 256 + b[i + 4],width:b[i + 5] * 256 + b[i + 6]};
        i += size;
      }
    }
    throw new Error('Evidence must be a valid PNG or JPEG image');
  }
  function run(text, bold = false) { return '<w:r>' + (bold ? '<w:rPr><w:b/></w:rPr>' : '') + '<w:t xml:space="preserve">' + xml(text) + '</w:t></w:r>'; }
  function paragraph(text, style = '', options = {}) {
    const props = (style ? '<w:pStyle w:val="' + xml(style) + '"/>' : '') + (options.keep ? '<w:keepNext/>' : '') + (options.center ? '<w:jc w:val="center"/>' : '');
    const runs = String(text ?? '').split('\n').map((v, i) => (i ? '<w:r><w:br/></w:r>' : '') + run(v, options.bold)).join('');
    return '<w:p><w:pPr>' + props + '</w:pPr>' + runs + '</w:p>';
  }
  function table(headers, rows, widths) {
    const cell = (text, width, heading) => '<w:tc><w:tcPr><w:tcW w:w="' + width + '" w:type="dxa"/><w:vAlign w:val="center"/>' + (heading ? '<w:shd w:val="clear" w:fill="DDE8F2"/>' : '') + '</w:tcPr>' + paragraph(text, 'TableText', {bold: heading}) + '</w:tc>';
    const row = (values, heading) => '<w:tr><w:trPr><w:cantSplit/>' + (heading ? '<w:tblHeader/>' : '') + '</w:trPr>' + values.map((v, i) => cell(v, widths[i], heading)).join('') + '</w:tr>';
    const borders = ['top','left','bottom','right','insideH','insideV'].map(v => '<w:' + v + ' w:val="single" w:sz="4" w:color="D9D9D9"/>').join('');
    return '<w:tbl><w:tblPr><w:tblW w:w="' + widths.reduce((a,b)=>a+b,0) + '" w:type="dxa"/><w:tblLayout w:type="fixed"/><w:tblBorders>' + borders + '</w:tblBorders><w:tblCellMar><w:top w:w="100" w:type="dxa"/><w:bottom w:w="100" w:type="dxa"/><w:left w:w="120" w:type="dxa"/><w:right w:w="120" w:type="dxa"/></w:tblCellMar></w:tblPr><w:tblGrid>' + widths.map(v=>'<w:gridCol w:w="'+v+'"/>').join('') + '</w:tblGrid>' + row(headers, true) + rows.map(v=>row(v,false)).join('') + '</w:tbl>' + paragraph('', 'Small');
  }
  const styles = '<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:styles xmlns:w="'+W+'"><w:docDefaults><w:rPrDefault><w:rPr><w:rFonts w:ascii="Aptos" w:hAnsi="Aptos" w:eastAsia="Microsoft JhengHei"/><w:color w:val="000000"/><w:sz w:val="22"/><w:szCs w:val="22"/><w:lang w:val="en-GB" w:eastAsia="zh-TW"/></w:rPr></w:rPrDefault><w:pPrDefault><w:pPr><w:spacing w:after="120" w:line="276" w:lineRule="auto"/><w:widowControl/></w:pPr></w:pPrDefault></w:docDefaults><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/></w:style><w:style w:type="paragraph" w:styleId="Title"><w:name w:val="Title"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="0" w:after="240"/></w:pPr><w:rPr><w:b/><w:color w:val="000000"/><w:sz w:val="44"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="240" w:after="140"/><w:outlineLvl w:val="0"/></w:pPr><w:rPr><w:b/><w:color w:val="000000"/><w:sz w:val="29"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Heading2"><w:name w:val="heading 2"/><w:basedOn w:val="Normal"/><w:pPr><w:keepNext/><w:spacing w:before="180" w:after="120"/><w:outlineLvl w:val="1"/></w:pPr><w:rPr><w:b/><w:color w:val="000000"/><w:sz w:val="25"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="TableText"><w:name w:val="Table Text"/><w:basedOn w:val="Normal"/><w:pPr><w:spacing w:after="0" w:line="252" w:lineRule="auto"/></w:pPr><w:rPr><w:sz w:val="19"/></w:rPr></w:style><w:style w:type="paragraph" w:styleId="Small"><w:name w:val="Small"/><w:basedOn w:val="Normal"/><w:rPr><w:sz w:val="18"/></w:rPr></w:style></w:styles>';
  function source(data, role) {
    const s = data.source_details?.[role] || data.sources?.[role] || data[role] || {};
    const labelText=s.drawing_number || data.source_labels?.[role] || s.drawing_numbers?.join(' / ') || s.original_filename || s.filename || '';
    return {label:labelText.replace(/\s*·\s*[a-f0-9]{8}$/i,''), filename:s.original_filename || s.filename || '', hash:s.sha256 || data.source_hashes?.[role] || '', page:s.page || data.source_pages?.[role] || 1};
  }
  function modelIssue(issue, data) { return issue?.source_kind === 'revit_model' || data?.source_kind === 'revit_model'; }
  function sourceValue(value) { return value === undefined || value === null ? 'Not provided' : typeof value === 'string' ? (value || '""') : typeof value === 'object' ? JSON.stringify(value) : String(value); }
  function modelFields(evidence) {
    const fields=evidence?.field_changes;
    if (Array.isArray(fields)) return fields.filter(v=>v && typeof v === 'object' && !Array.isArray(v));
    return fields && typeof fields === 'object' ? Object.entries(fields).map(([name,v])=>v && typeof v === 'object' ? {name,...v} : {name,new:v}) : [];
  }
  function sourceFieldValue(field, role) {
    const value=Object.prototype.hasOwnProperty.call(field,role) ? field[role] : field[role+'_value'], unit=field[role+'_unit'] ?? field.unit;
    return sourceValue(value)+(typeof unit === 'string' && unit && value !== undefined && value !== null ? ' '+unit : '');
  }
  async function create(data, options = {}) {
    if (!data || typeof data !== 'object') throw new Error('Comparison data is required');
    const language = 'en';
    const l = (zh,en)=>label(zh,en,language), absent=l('未提供','Not provided');
    const meta = options.metadata || {}, suppliedIssues = options.issues || data.issues || [], reviews=options.reviews || {}, assets=options.assets || {};
    if (!Array.isArray(suppliedIssues)) throw new Error('Selected issues must be an array');
    const issues=suppliedIssues.map(i=>modelIssue(i,data) && i.source_kind !== 'revit_model' ? {...i,source_kind:'revit_model'} : i);
    const modelReview=data.source_kind === 'revit_model' || issues.some(i=>modelIssue(i)), draftModelMapping=modelReview && data.model_mapping_status !== 'verified_sheet_pdf', nativeModelPlan=modelReview && data.page_background === 'native_revit_sheet';
    const review = i => {const r=reviews[i.id]; return typeof r === 'string' ? r : r?.status || i.review_status || 'pending';};
    const title=String(meta.report_title || (modelReview ? 'Query of Model Differences' : 'Query of Drawing Differences'));
    const files={}, rels=[{id:'rIdStyles',type:'styles',target:'styles.xml'},{id:'rIdSettings',type:'settings',target:'settings.xml'},{id:'rIdFooter',type:'footer',target:'footer1.xml'}], old=source(data,'old'), fresh=source(data,'new');
    const contentTypes=new Set(); let imageCount=0;
    const image = path => {
      if (!path) return '';
      const b = assets instanceof Map ? assets.get(path) : assets[path];
      if (!b) return paragraph(l('此項尚未附上比較證據圖片','Comparison evidence image has not been attached for this item'), 'Small');
      const info=imageInfo(b); if (!info.width || !info.height || info.width>100000 || info.height>100000) throw new Error('Invalid evidence image dimensions');
      const n=++imageCount, target='media/evidence'+n+'.'+info.ext, rid='rIdImage'+n;
      files['word/'+target]=new Uint8Array(b); contentTypes.add(info.ext); rels.push({id:rid,type:'image',target});
      const scale=Math.min(6.65/info.width,4.0/info.height), cx=Math.round(info.width*scale*EMU), cy=Math.round(info.height*scale*EMU);
      return '<w:p><w:pPr><w:jc w:val="center"/><w:keepNext/></w:pPr><w:r><w:drawing><wp:inline distT="0" distB="0" distL="0" distR="0"><wp:extent cx="'+cx+'" cy="'+cy+'"/><wp:docPr id="'+n+'" name="Comparison evidence '+n+'" descr="'+xml(path)+'"/><wp:cNvGraphicFramePr/><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="'+n+'" name="'+xml(path)+'"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="'+rid+'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="'+cx+'" cy="'+cy+'"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r></w:p>';
    };
    let body=paragraph(title,'Title');
    body+=paragraph(nativeModelPlan ? 'Model field differences are the primary evidence. This report retains element identifiers and values from exported Revit snapshots. Native sheet circles provide drawing references; engineering significance remains subject to review.' : modelReview ? 'This report records element differences in exported Revit model snapshots and retains source identifiers and field values for review. Pending review means that engineering significance remains subject to review.' : 'This query records observed differences between the referenced drawing versions and requests confirmation of the intended revisions. Items marked Pending review remain subject to verification.');
    if (nativeModelPlan && draftModelMapping) body+=paragraph('NATIVE REVIT SHEET EXPORTS — PDF/image consistency, temporary annotation output and PDF locations require runtime verification. Missing PDF coordinates do not mean an element is invisible. The viewer displays exported results and does not detect model changes.','Small');
    else if (draftModelMapping) body+=paragraph('DRAFT MODEL PLAN — The plan is generated from captured 2D linework. Paper coordinates have not been verified against an official sheet PDF. Review element identifiers and source values; verify plan locations before issue.','Small');
    body+=paragraph(l('報告資料','Report information'),'Heading1');
    body+=table([l('資料','Field'),l('內容','Value')],[[l('項目','Project'),meta.project || absent],[l('客戶','Client'),meta.client || absent],[l('編製人','Prepared by'),meta.prepared_by || absent],[l('選取項目','Selected items'),String(issues.length)]],[2100,7538]);
    body+=paragraph(modelReview ? 'Model sources and reference snapshot dates' : l('圖紙來源及收到日期','Drawing sources and receipt dates'),'Heading1');
    const receivedOld=dateOnly(meta.received_old), receivedNew=dateOnly(meta.received_new);
    body+=table([l('資料','Field'),modelReview ? 'Earlier revision' : l('舊版','Old drawing'),modelReview ? 'Later revision' : l('新版','New drawing')],[[modelReview ? 'Source and revision' : l('圖紙編號及版本','Drawing and version'),old.label || absent,fresh.label || absent],[l('來源檔名','Source filename'),old.filename || absent,fresh.filename || absent],[l('頁碼','Page'),String(old.page),String(fresh.page)],[modelReview ? 'Reference snapshot date' : l('收到圖紙日期','Drawing receipt date'),receivedOld || absent,receivedNew || absent]],[2100,3769,3769]);
    if ((receivedOld || receivedNew) && !modelReview) body+=paragraph(meta.received_dates_source === 'pdf_moddate' ? l('收到日期按 PDF 內部修改日期預填，請確認。','Receipt dates are prefilled from the internal PDF modification dates. Please confirm.') : l('收到日期按原檔修改日期預填，請確認。','Receipt dates are prefilled from the original file modification dates. Please confirm.'),'Small');
    body+=paragraph(l('簡單改變描述','Summary of Observed Differences'),'Heading1');
    const counts={};for(const i of issues)counts[i.category]=(counts[i.category]||0)+1;
    const summaryCategories={wall:modelReview ? 'wall' : 'wall or opening',door:'door',window:'window',mark:'mark',dimension:'dimension or numeric annotation',text:'text or note',geometry:'unclassified geometry',annotation_movement:'annotation movement',context:'other'};
    const defaultSummary=issues.length ? 'The selected comparison items comprise '+Object.entries(counts).map(([category,count])=>count+' '+(summaryCategories[category]||'other')+(modelReview ? ' difference' : ' candidate')+(count===1?'':'s')).join(', ')+'. Please review the documented differences and confirm the intended revisions.' : 'No change items have been selected.';
    body+=paragraph(meta.summary || defaultSummary);
    if (issues.length) body+=table([l('編號','No'),l('分類及變更','Category and change'),l('覆核狀態','Review status')],issues.map((i,n)=>[String(i.display_number || n+1),named(categoryNames,i.category,language)+'\n'+issueText(i,'title',language),named(statusNames,review(i),language)]),[650,6888,2100]);
    for (let n=0;n<issues.length;n++) {
      const i=issues[n]; body+='<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      body+=paragraph(l('變更項目','Change item')+' '+(i.display_number || n+1),'Heading1');
      body+=paragraph(issueText(i,'title',language),'Heading2');
      body+=table([l('分類','Category'),l('重要程度','Priority'),l('覆核狀態','Review status')],[[named(categoryNames,i.category,language),modelIssue(i) && i.priority === 'important' ? 'Major change' : modelIssue(i) && i.priority === 'minor' ? 'Minor change' : named(priorityNames,i.priority || 'check',language),named(statusNames,review(i),language)]],[3212,3213,3213]);
      body+=paragraph(l('位置','Location')+' '+issueText(i,'location_hint',language));
      body+=paragraph(l('簡單改變描述','Brief description of changes'),'Heading2');
      body+=paragraph(issueText(i,'description',language));
      if (i.why_it_matters) body+=paragraph(issueText(i,'why_it_matters',language));
      if (modelIssue(i)) {
        const evidence=i.model_evidence || {}, fields=modelFields(evidence);
        body+=paragraph('Model element source','Heading2');
        body+=table(['Source field','Value'],[['Element UniqueId',sourceValue(evidence.unique_id)],['Earlier ElementId',sourceValue(evidence.old_element_id)],['Later ElementId',sourceValue(evidence.new_element_id)],['Revit category',sourceValue(evidence.category_key)],['Model change kind',sourceValue(evidence.kind || i.kind)],['Plan mapping status',sourceValue(i.mapping_status || data.model_mapping_status)]],[2400,7238]);
        if (fields.length) body+=table(['Field','Earlier value','Later value'],fields.map(field=>[String(field.field || field.name || field.key || ''),sourceFieldValue(field,'old'),sourceFieldValue(field,'new')]),[3212,3213,3213]);
        else body+=paragraph('No field deltas are listed for this item. For additions or removals, review the source element identifiers and recorded change.','Small');
        if (nativeModelPlan) {
          const a=root.PCStrings?.nativeAnnotation ? root.PCStrings.nativeAnnotation(i) : {circle_number:i.circle_number ?? i.native_annotation?.circle_number ?? i.display_number,role:i.native_annotation_role ?? i.native_annotation?.role,old_status:i.old_annotation_status ?? i.native_annotation?.old_status,current_status:i.new_annotation_status ?? i.current_annotation_status ?? i.native_annotation?.new_status ?? i.native_annotation?.current_status};
          const role=root.PCStrings?.nativeRole ? root.PCStrings.nativeRole(a.role,'en') : sourceValue(a.role), earlier=root.PCStrings?.nativeStatus ? root.PCStrings.nativeStatus(a.old_status,'en') : sourceValue(a.old_status), current=root.PCStrings?.nativeStatus ? root.PCStrings.nativeStatus(a.current_status,'en') : sourceValue(a.current_status);
          body+=paragraph('Native annotation source and verification status','Heading2');
          body+=table(['Source field','Value'],[['Circle number (source)',sourceValue(a.circle_number)],['Annotation area (source)',role],['Earlier area annotation status',earlier],['Current area annotation status',current],['Native PDF filename (source)',sourceValue(data.native_pdf_file)]],[3000,6638]);
        }
      }
      body+=paragraph('Confirmation Requested','Heading2');
      const query=modelIssue(i)?'Please review this element\'s source field differences and confirm their engineering and coordination implications. Verify its location against the official drawing before issue.':i.category==='wall'?'Please confirm whether the highlighted changes to the wall boundaries are intentional, and advise the applicable wall type and revised construction information. Please identify any associated coordination requirements.':i.category==='mark'?'Please confirm the revised annotation or mark and its corresponding element and schedule reference. Please clarify whether this is an annotation revision or a change to the physical element.':i.category==='dimension'?'Please confirm the revised numeric annotation, its applicable units and its reference to the relevant element or dimension. Please advise whether associated setting out or coordination information requires revision.':'Please review the highlighted difference and confirm whether the revised information is intentional. Please provide clarification and identify any associated coordination requirements.';
      body+=paragraph(query);
      body+=paragraph(nativeModelPlan ? 'Native Revit sheet image evidence' : modelIssue(i) ? 'Earlier and later captured model plan evidence' : l('舊新版圖紙證據','Old and new drawing evidence'),'Heading2');
      body+=image(i.evidence_image);
      body+=paragraph(nativeModelPlan ? 'The images are native Revit sheet exports. Compare baseline, current and annotated sheet outputs using the recorded circle numbers. PDF/image consistency and circle positions await runtime verification.' : modelIssue(i) ? 'OLD denotes the earlier capture; NEW denotes the later capture. Red shows the earlier model position and blue the later model position.' : l('OLD 為舊版 NEW 為新版','OLD denotes the old drawing and NEW denotes the new drawing.')+(i.category==='wall' ? '\n'+l('紅色為舊邊界 藍色為新邊界','Red denotes old boundaries and blue denotes new boundaries.') : ''),'Small');
      body+=paragraph(l('確認程度','Confidence')+' '+named(confidenceNames,i.confidence,language)+'\n'+issueText(i,'certainty',language),'Small');
      body+=paragraph(l('追溯編號','Trace reference')+' '+String(i.id || '')+'\n'+l('來源證據','Source evidence')+' '+(i.source_ids || [i.id]).join(', '),'Small');
    }
    body+='<w:sectPr><w:footerReference w:type="default" r:id="rIdFooter"/><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1134" w:right="1134" w:bottom="1134" w:left="1134" w:header="567" w:footer="567" w:gutter="0"/></w:sectPr>';
    files['word/document.xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="'+W+'" xmlns:r="'+R+'" xmlns:wp="http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" xmlns:pic="http://schemas.openxmlformats.org/drawingml/2006/picture"><w:body>'+body+'</w:body></w:document>';
    files['word/styles.xml']=styles;
    files['word/settings.xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:settings xmlns:w="'+W+'"><w:updateFields w:val="true"/></w:settings>';
    files['word/footer1.xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:ftr xmlns:w="'+W+'"><w:p><w:pPr><w:jc w:val="center"/></w:pPr>'+run(l('頁','Page')+' ')+'<w:fldSimple w:instr="PAGE">'+run('1')+'</w:fldSimple>'+run(' / ')+'<w:fldSimple w:instr="NUMPAGES">'+run('1')+'</w:fldSimple></w:p></w:ftr>';
    files['word/_rels/document.xml.rels']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="'+REL+'">'+rels.map(r=>'<Relationship Id="'+r.id+'" Type="'+R+'/'+r.type+'" Target="'+r.target+'"/>').join('')+'</Relationships>';
    files['_rels/.rels']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Relationships xmlns="'+REL+'"><Relationship Id="rIdDocument" Type="'+R+'/officeDocument" Target="word/document.xml"/><Relationship Id="rIdCore" Type="http://schemas.openxmlformats.org/package/2006/relationships/metadata/core-properties" Target="docProps/core.xml"/><Relationship Id="rIdApp" Type="'+R+'/extended-properties" Target="docProps/app.xml"/></Relationships>';
    files['docProps/core.xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><cp:coreProperties xmlns:cp="http://schemas.openxmlformats.org/package/2006/metadata/core-properties" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:title>'+xml(title)+'</dc:title><dc:creator>'+xml(meta.prepared_by || 'PlanCompare')+'</dc:creator><dc:description>'+xml('Selected drawing comparison candidates with evidence and review status')+'</dc:description></cp:coreProperties>';
    files['docProps/app.xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Properties xmlns="http://schemas.openxmlformats.org/officeDocument/2006/extended-properties"><Application>PlanCompare</Application></Properties>';
    files['[Content_Types].xml']='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/>'+Array.from(contentTypes).map(e=>'<Default Extension="'+e+'" ContentType="image/'+(e==='jpg'?'jpeg':'png')+'"/>').join('')+'<Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/><Override PartName="/word/settings.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.settings+xml"/><Override PartName="/word/footer1.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.footer+xml"/><Override PartName="/docProps/core.xml" ContentType="application/vnd.openxmlformats-package.core-properties+xml"/><Override PartName="/docProps/app.xml" ContentType="application/vnd.openxmlformats-officedocument.extended-properties+xml"/></Types>';
    const filename=(meta.report_title || 'Drawing_Change_Report').replace(/[<>:"/\\|?*\u0000-\u001F]/g,'_').slice(0,100)+'_'+language+'.docx';
    return {blob:zip(files),filename};
  }
  const api={create,issueText,dateOnly}; root.PlanCompareWord=api;
  if (typeof module !== 'undefined' && module.exports) module.exports=api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
