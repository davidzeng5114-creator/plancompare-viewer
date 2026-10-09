(function (global) {
  'use strict';
  const LANGUAGE_KEY = 'plancompare-language';
  let language = 'zh';
  try { language = localStorage.getItem(LANGUAGE_KEY) === 'en' ? 'en' : 'zh'; } catch (_) {}
  const dictionary = {
    '上載圖紙':'Upload drawings','最近比較':'Recent comparisons','本地運行':'Runs locally','● 本地運行':'● Runs locally',
    '▱　上載圖紙':'▱  Upload drawings','▤　最近比較':'▤  Recent comparisons','▤　變更清單':'▤  Change list','▱　載入比較檔案':'▱  Load comparison file',
    '向量牆線及 Mark 比較':'Vector wall and Mark comparison','Ollama 可選輔助核對':'Optional local Ollama review',
    '版本 9':'Version 9','比較變更':'Compare changes','匯出報告':'Export report','比較兩個版本的圖紙':'Compare two drawing revisions',
    '自動分類牆段、開口及 Mark 內容變更。一次列出已識別的全部變更並分類，細小變動與純標註移位可獨立查看。':'Classify wall segments, openings and Mark content changes. List all detected changes together, with minor edits and annotation movement in separate categories.',
    '目前牆形辨識適用於具有向量邊界的直線牆；掃描圖仍可做圖像及人工核對。':'Wall inference currently supports straight walls with vector boundaries. Scanned drawings support image comparison and manual review.',
    '01　舊版圖紙':'01  Earlier revision','02　新版圖紙':'02  Later revision','舊版 PDF':'Earlier PDF','新版 PDF':'Later PDF',
    '舊版頁碼':'Earlier page','新版頁碼':'Later page','選擇 PDF。檔名相同也會分開保存。':'Choose a PDF. Files with the same name are saved separately.',
    '選擇另一個版本的 PDF。':'Choose the other revision of the PDF.','圖像清晰度':'Image resolution','快速 · 150 dpi':'Fast · 150 dpi',
    '標準 · 200 dpi':'Standard · 200 dpi','精細 · 250 dpi':'Detailed · 250 dpi','本地 Ollama 模型':'Local Ollama model',
    '讀取本地模型…':'Loading local models…','模型輔助核對':'Model-assisted review','關閉 · 仍自動分類牆及 Mark':'Off · automatic wall and Mark classification remains active',
    '先核對 2 項':'Review first 2 candidates','先核對 6 項':'Review first 6 candidates','先核對 12 項':'Review first 12 candidates',
    '核對已分類變更（最多 200 項）':'Review classified changes (up to 200)','進階設定':'Advanced settings','排除圖框區域':'Exclude sheet-border regions',
    '不排除':'No exclusions','GP003 樣本專用遮罩':'GP003-specific exclusion mask','另做完整向量實驗':'Run the full vector experiment',
    '開始比較':'Start comparison','讀取失敗':'Unable to load data','正在本機保存 PDF…':'Saving the PDF locally…',
    'PDF 已保存，請確認比較頁碼。':'PDF saved. Check the page numbers to compare.','不用模型':'No model','（同權重別名）':' (same-weight alias)',
    'Ollama 未就緒':'Ollama is unavailable','開啟圖紙變更 →':'Open drawing changes →','尚未完成新版比較。':'No completed comparisons yet.',
    '比較完成。點選下方按鈕查看分類及平面圖。':'Comparison complete. Open the categorized changes and plan below.',
    '正在抽取圖紙、對齊及比較牆線／標註…':'Extracting drawings, aligning pages and comparing wall boundaries and annotations…',
    '變更清單':'Change list','圖紙留在這部電腦':'Drawings stay on this computer','分類比較 · 人工覆核':'Categorized comparison · human review',
    '分類查看全部變更':'Review all categorized changes','匯出目前清單':'Export report','按類別列出的全部問題':'All issues grouped by category',
    '問題清單':'Issue list','各類變更一次列出，主要、待確認及小變動均保留。點選一項查看確切位置。':'All detected categories are listed, including major, unconfirmed and minor changes. Select a candidate to see its location.',
    '搜尋問題':'Search issues','搜尋 Mark、文字或編號':'Search Mark, text or ID','清除篩選 · 顯示全部':'Clear filters · show all',
    '圖紙變更':'Drawing changes','問題類別':'Issue categories','變更重要程度':'Change priority','所有程度':'All priorities',
    '主要變更':'Major changes','待確認':'Needs review','小變動':'Minor changes','牆變更種類':'Wall change type','所有牆變化':'All wall changes',
    '圖紙圖層':'Drawing layer','新版圖紙':'Later drawing','舊版圖紙':'Earlier drawing','紅藍疊圖':'Red/blue overlay',
    '縮小':'Zoom out','放大':'Zoom in','全圖':'Fit plan','建築平面圖':'Architectural plan','分類問題位置；點選候選或聚合圓圈放大':'Categorized issue locations; select a candidate or cluster to zoom in',
    '舊邊界':'Earlier boundary','新邊界':'Later boundary','滾輪縮放 · 拖動平移':'Scroll to zoom · drag to pan',
    '全圖以圓圈顯示同區候選數；放大後顯示清單的固定編號。':'Overview circles show candidate counts in each area. Zoom in to see fixed issue numbers.',
    '聚合圓圈內是同區候選數，點選放大；全部逐項問題保留在左側清單。':'Cluster circles show the number of candidates in an area. Click to zoom; the complete issue list remains on the left.',
    '圖上編號與清單一致；彩色邊界為辨識候選，未判明用途仍須核實。':'Plan numbers match the list. Colored boundaries are inferred candidates; their purpose still needs verification.',
    '辨識範圍與核對說明':'Detection coverage and review notes','變更詳情':'Change details','點清單或圖上編號':'Select a list item or plan number',
    '點選左側清單或圖上編號':'Select a list item or a plan number','查看哪裡改了、如何分類。':'See what changed and how it is classified.',
    '分類列出，逐項可查看':'Categorized candidates, individually reviewable','牆形與 Mark 內容改動':'Wall geometry and Mark content changes',
    '用途／匹配仍需核實':'Purpose or pairing needs verification','局部變動／標註移位':'Local edits or annotation movement','關閉':'Close',
    '舊版與新版局部證據':'Earlier and later detail evidence','匯出覆核報告':'Export review report','載入比較檔案':'Load a comparison file',
    '● 只讀檢視':'● Read-only viewer','只觀看已完成的比較':'View completed comparisons','可覆核及匯出 Word':'Review and export Word reports',
    '全部類別':'All categories','牆體／開口變更':'Walls / openings','Mark 內容／新增移除':'Mark content / additions / removals',
    '尺寸／數值標註':'Dimensions / numeric annotations','文字／說明變更':'Text / notes','其他幾何變更':'Other geometry',
    '標註位置移動':'Annotation movement','待識別的變更':'Unclassified changes','新增牆段':'Wall added','移除牆段':'Wall removed',
    '牆段移除':'Wall removed','牆段移位':'Wall shifted','牆厚改變':'Wall thickness changed','開口改變':'Wall opening changed',
    '牆上開口改變':'Wall opening changed','牆長改變':'Wall length changed','牆段長度改變':'Wall length changed',
    '邊界待核實':'Boundary change — verify','牆邊界待確認':'Boundary change — verify','牆段位置及厚度改變':'Wall position and thickness changed',
    '主要':'Major','待識別':'Unclassified','位置':'Location','圖面定位':'Locate on plan','按圖面定位':'Locate on plan',
    '變更內容':'What changed','需留意':'Review consideration','同一位置的改動':'Changes at the same location','覆核狀態':'Review status',
    '目前問題覆核狀態':'Current issue review status','待核對':'Pending review','已核對 · 保留':'Reviewed · retain','忽略此項':'Ignore this candidate',
    '查看舊版':'View earlier drawing','查看新版':'View later drawing','判斷依據及附近標註':'Evidence and nearby annotations',
    '查看此比較的機器資料':'View structured comparison data','已核對':'Reviewed','已忽略':'Ignored','未覆核':'Not reviewed',
    '目前篩選沒有問題，清除篩選可回到全部清單。':'No candidates match these filters. Clear filters to show all.',
    '此項不在目前篩選範圍，請從清單選取另一項。':'This candidate is outside the active filters. Select another item from the list.',
    '對齊信心不足，請先核對對齊；所有候選仍完整列出，分類為暫定。':'Alignment confidence is low. Check registration first; all detected candidates are listed with provisional classifications.',
    '文字配對支持':'Supported by text pairing','構件身份未辨識，保留候選':'Element identity is unconfirmed; candidate retained',
    '文字或標註內容相同':'Text or annotation content is unchanged','牆形幾何推斷，需核對用途':'Wall-shaped geometry inferred; verify its purpose',
    '邊界配對不足，待核對':'Insufficient boundary pairing; review required','AI 建議優先核對，未確認':'AI suggests priority review; unconfirmed',
    'AI 視覺推測，未確認':'AI visual inference; unconfirmed','AI 未能確認':'AI could not confirm','對齊待確認，配對及分類均為暫定':'Alignment unconfirmed; pairing and classification are provisional',
    '型號或編號內容改變，可能影響構件選型；具體規格需對照 Schedule。':'Mark or identifier content changed and may affect element selection. Check the schedule for the actual specification.',
    '標註內容不變，位置調整通常不影響施工。':'Annotation content is unchanged. Repositioning the label usually does not affect construction.',
    '需要核對原圖，確認是否涉及施工內容；目前證據不足以判為重大改動。':'Check the source drawings for construction implications. Evidence is insufficient to confirm a major change.',
    '此處仍有未被文字或已辨識牆段解釋的圖形變更，須確認構件與工程影響。':'Geometry changes remain unexplained by text or inferred walls. Verify the element and engineering impact.',
    '牆邊界或開口改動可能影響平面佈局、門洞及相鄰構件協調。':'Wall boundary or opening changes may affect the layout, door openings and coordination with adjacent elements.',
    '本地 AI 提出構件變更候選；請先核對圖形和標註，不能據此直接施工。':'The local model suggests an element-change candidate. Verify the drawing and annotation before using it for construction.',
    '查看左右原圖，確認後保留或忽略。':'Review the earlier and later details, then retain or ignore the candidate.',
    '對照紅色舊邊界及藍色新邊界，確認構件用途與改動。':'Compare the red earlier boundary and blue later boundary; verify the element purpose and change.',
    '依據圖紙證據列出；用途及工程影響仍須核對。':'Listed from drawing evidence. Purpose and engineering impact require verification.',
    '紙面數值不是實際施工尺寸，主要／小變動是幾何門檻分類。':'Paper measurements are not construction dimensions. Major/minor labels follow geometry thresholds.',
    '原生文字差異來源 {n} 筆，{accounted} 筆已列入或合併到分類清單。':'Native text changes: {n}; {accounted} are listed or grouped into categorized candidates.',
    '原生文字差異來源 {n} 筆。':'Native text changes: {n}.','圖像差異來源 {n} 個區域；分類清單按牆、文字、標註及未識別幾何重新合併。':'Image change source: {n} regions, regrouped into walls, text, annotations and unclassified geometry.',
    '牆形候選 {n} 項。':'Wall-shape candidates: {n}.','其餘幾何候選 {n} 項保留待確認。':'Other geometry candidates retained for review: {n}.',
    '圖像差異共 {n} 像素。':'Total changed image pixels: {n}.','文字／標註相關':'Text / annotation related','已關聯牆形':'Linked to inferred walls',
    '其餘幾何已列入清單':'Other geometry listed','小於噪音門檻':'Below noise threshold','{label}：{n} 像素。':'{label}: {n} pixels.',
    '差異像素帳目相符，門檻內細碎噪音數量亦保留記錄。':'Changed-pixel accounting balances; subthreshold noise is also counted.',
    '差異像素帳目相符':'Pixel accounting balances','差異像素帳目未完全相符，仍須核對未歸類來源。':'Changed-pixel accounting does not balance; review unclassified sources.',
    '差異像素仍待核對':'Pixel accounting needs review','全部清單指本次偵測到的候選；未識別形狀保留待確認。來源覆蓋統計不代表所有工程問題都已找到，牆用途、材料、工程影響及漏檢仍須人工核實。':'The complete list contains candidates detected in this comparison. Unidentified geometry remains for review. Coverage statistics do not guarantee detection of every engineering issue; verify wall purpose, materials, impact and missed changes.',
    '來源核對':'Source accounting','文字':'Text','圖面左上方':'Upper left of plan','圖面中上方':'Upper center of plan','圖面右上方':'Upper right of plan',
    '圖面左部':'Left of plan','圖面中部':'Center of plan','圖面右部':'Right of plan','圖面左下方':'Lower left of plan','圖面中下方':'Lower center of plan','圖面右下方':'Lower right of plan',
    '{n} 頁':'{n} pages','第 {n} 頁':'Page {n}','圖紙比較 · {id}':'Drawing comparison · {id}',
    '全部 {n} 項 · 重點 {major} · 待確認 {check} · 小變動／移位 {minor}':'All {n} · Major {major} · Needs review {check} · Minor / movement {minor}',
    'Ollama 正在輔助核對 {done} / {total}。可先開啟變更頁。':'Ollama review in progress: {done} / {total}. You can open the changes now.',
    '此區 {n} 項候選，點選放大':'{n} candidates in this area; select to zoom','同區 {n} 項候選':'{n} candidates in the same area',
    '{n} / {total} 項':'{n} / {total} candidates','全部 {n} 項':'All {n} candidates','顯示 {n} / {total} 項':'Showing {n} / {total}',
    '{n} 項':'{n} candidates','{n} 已核對':'{n} reviewed','{n} 項列入清單':'{n} candidates listed','{n} 項主要變更':'{n} major changes',
    '{n} 項待確認':'{n} need review','{n} 項小變動':'{n} minor changes','配對邊界及端部／交接證據。':'Paired boundaries and end/junction evidence.',
    '紙面改動長度 {n} pt':'Changed length on paper: {n} pt','紙面偏移 {n} pt':'Offset on paper: {n} pt',
    '附近標註：{text}':'Nearby annotation: {text}','此項合併 {n} 筆同區證據，原始編號：{ids}':'{n} local source records grouped here; source IDs: {ids}',
    '模型平面變更':'Model plan changes','牆體變更':'Walls','門變更':'Doors','窗變更':'Windows','樓板變更':'Floors','結構柱變更':'Structural columns','梁變更':'Beams',
    '模型元素差異':'Model element differences','模型新增':'Model addition','模型移除':'Model removal','模型修改':'Model modification',
    '模型位置改變':'Model position change','模型型號改變':'Model type change','模型參數改變':'Model parameter change','模型幾何改變':'Model geometry change',
    '舊模型位置':'Earlier model position','新模型位置':'Later model position','模型平面草稿':'Draft model plan',
    '舊模型平面':'Earlier model plan','新模型平面':'Later model plan','模型平面圖層':'Model plan layer',
    '圖上編號對應模型差異；紅色及藍色表示舊、新捕捉位置。工程影響仍待覆核。':'Plan numbers identify model differences. Red and blue show earlier and later captured positions. Engineering impact remains subject to review.',
    '模型平面草稿由捕捉的 2D 線條建立；紙面座標尚未對照正式 Sheet PDF 驗證。請以元素編號及來源值覆核，圖面位置待核對。':'Draft model plan from captured 2D linework. Paper coordinates have not been verified against an official sheet PDF. Review the element identifiers and source values; plan locations require verification.',
    '模型元素資料':'Model element source','元素 UniqueId':'Element UniqueId','舊 ElementId':'Earlier ElementId','新 ElementId':'Later ElementId',
    'Revit 類別':'Revit category','來源欄位變更':'Source field changes','欄位':'Field','舊值':'Earlier value','新值':'Later value','未提供':'Not provided',
    '此項未附來源欄位差異；請核對元素來源記錄。':'No field deltas are listed for this item. For additions or removals, review the source element identifiers and recorded change.',
    '模型變更種類':'Model change kind','模型進入比較範圍':'Model element entered comparison scope','模型退出比較範圍':'Model element left comparison scope','定位狀態':'Plan location status','所選平面沒有可見線條':'No visible linework in the selected plan',
    '圖面定位待核對':'Plan location requires verification','Sheet PDF 定位已由來源聲明核對':'Sheet PDF mapping is declared verified by the source',
    '元素資料來自模型快照；工程影響仍需覆核。':'Element data comes from model snapshots. Engineering impact remains subject to review.',
    '模型差異來源及定位說明':'Model source and location notes','模型差異列出 {n} 項；保留匯出時的元素編號、類別及來源欄位。':'The export lists {n} model differences with element identifiers, categories and source fields.',
    '比較範圍取決於匯出快照、類別、欄位及視圖；清單不保證涵蓋全部模型或工程問題。覆核狀態與模型欄位差異分開保存。':'Comparison coverage depends on the exported snapshots, categories, fields and views. The list does not guarantee coverage of every model or engineering issue. Review decisions are stored separately from model field differences.',
    '捕捉的模型平面，非正式 Sheet PDF':'Captured model plan; sheet PDF mapping is unverified','模型欄位／位置變更':'Model field / position changes',
    '工程影響及平面定位待覆核':'Engineering impact and plan locations require review','局部模型差異':'Local model differences',
    '搜尋元素、欄位或編號':'Search element, field or ID','模型來源已列出；請覆核工程影響及圖面位置。':'Model sources are listed. Review engineering impact and plan locations.',
    '{n} / {total} 項模型差異':'{n} / {total} model differences','全部 {n} 項模型差異':'All {n} model differences',
    '顯示 {n} / {total} 項模型差異':'Showing {n} / {total} model differences','{n} 項模型差異':'{n} model differences',
    '聚合圓圈顯示同區模型差異數，點選放大；全部逐項差異保留在左側清單。':'Cluster circles show the number of model differences in an area. Click to zoom; the complete difference list remains on the left.',
    '此區 {n} 項模型差異，點選放大':'{n} model differences in this area; select to zoom','同區 {n} 項模型差異':'{n} model differences in the same area',
    '模型差異 · 原生 Revit 圖紙':'Model differences · native Revit sheets','圈注的原生圖紙':'Annotated native sheet',
    '舊版原生圖紙':'Earlier native sheet','目前原生圖紙':'Current native sheet','原生圖紙圖層':'Native sheet layer','查看原生圈注圖紙':'View the annotated native sheet',
    '先查看模型差異及來源值。原生 Revit 圖紙輸出；請核對此項目的 PDF／圖像一致性、圈注可見性及圖面位置。':'Review model differences and source values first. These are native Revit sheet exports; review this project\'s PDF/image consistency, annotation visibility and drawing locations.',
    '圈號已列於清單；請在原生圖紙核對。未有 PDF 定位座標不代表構件不可見。':'Circle numbers are listed for checking on the native sheet. Missing PDF coordinates do not mean the element is invisible.',
    '分享閱覽頁只載入已匯出的結果，不執行模型變更判定。':'The shared viewer displays exported results and does not detect model changes.',
    '來源值先列出，再於原生 Revit 圖紙核對圈號。':'Source values are listed first; check the circle numbers on the native Revit sheet.',
    '原生圈注來源及驗證狀態':'Native annotation source and verification status','圈號（來源）':'Circle number (source)',
    '圈注範圍（來源）':'Annotation area (source)','舊區圈注狀態':'Earlier area annotation status','目前區圈注狀態':'Current area annotation status',
    '舊區／舊位置':'Earlier area / position','目前區／目前位置':'Current area / position','舊區及目前區':'Earlier and current areas','未定位':'Unmapped',
    '原生圈注及 PDF 定位待驗證':'Native annotations and PDF locations await verification','圈注待驗證':'Annotation awaits verification',
    '已要求圈注，輸出待驗證':'Annotation requested; output awaits verification','Revit 註記已建立，PDF 輸出待驗證':'Revit annotation created; PDF output awaits verification',
    '圈注未完成／未定位':'Annotation incomplete / unmapped','未建立圈注':'No circle annotation created','不適用':'Not applicable','舊區圈注':'Earlier area annotations','目前區圈注':'Current area annotations',
    '所選原生圖紙沒有可見線條（來源標示）':'No visible linework in the selected native sheet (source status)',
    '圈號對應來源元素差異':'Circles reference source element differences','原生 PDF 文件（來源）':'Native PDF filename (source)',
    'Revit 原生圖紙圖像':'Native Revit sheet image','下載圈註 PDF':'Download annotated PDF','下載舊版 PDF':'Download earlier PDF','下載目前 PDF':'Download current PDF','匯出目前圖紙 Word':'Export current sheet Word','原生圖紙背景來源狀態（原始記錄）':'Native sheet background source status (raw records)',
    '下載標註 PDF':'Download annotated PDF','標註的原生圖紙':'Annotated native sheet','查看原生標註圖紙':'View the annotated native sheet',
    '綠色新增／橙色修改，牆身 hatch；OLD 小標記為舊位置':'Green additions / orange modifications with wall hatching; small OLD markers show earlier positions',
    '先看模型來源值；於原生圖紙放大核對牆身 hatch 及小標記。':'Review model source values; zoom into the native sheet to check wall hatching and small markers.',
    '放大查看牆身 hatch 與小編號，對照清單中的元素前後資料。':'Zoom into wall hatching and small numbers; compare the earlier and current element data in the list.',
    '先查看模型差異及來源值。原生 Revit 圖紙輸出；請核對此項目的 PDF／圖像一致性、標註可見性及圖面位置。':'Review model differences and source values first. These are native Revit sheet exports; review this project\'s PDF/image consistency, annotation visibility and drawing locations.',
    '原生標註來源及驗證狀態':'Native annotation source and verification status','標記編號（來源）':'Marker number (source)','標註範圍（來源）':'Annotation area (source)',
    '舊位置小標記狀態':'Earlier position marker status','目前小標記狀態':'Current marker status','目前構件色彩／填充（來源）':'Current element colour / fill applied (source)','未建立小標記':'No small marker created','標記未完成／未定位':'Marker incomplete / unmapped','標記待驗證':'Marker awaits verification',
    '原生標註及 PDF 定位待驗證':'Native annotations and PDF locations await verification'
  };
  const reverse = new Map(Object.entries(dictionary).map(([zh,en]) => [en,zh]));
  function t(key, values = {}, lang = language) {
    const canonical = reverse.get(String(key)) || String(key);
    let value = lang === 'en' ? dictionary[canonical] || canonical : canonical;
    return value.replace(/\{(\w+)\}/g, (_, name) => values[name] === undefined ? '{'+name+'}' : String(values[name]));
  }
  function getLanguage() { return language; }
  function setLanguage(value) {
    language = value === 'en' ? 'en' : 'zh';
    try { localStorage.setItem(LANGUAGE_KEY, language); } catch (_) {}
    document.documentElement.lang = language === 'en' ? 'en' : 'zh-Hant';
    global.dispatchEvent(new CustomEvent('plancompare-language-changed', {detail:{language}}));
    return language;
  }
  const sourceTexts = new WeakMap(), sourceAttributes = new WeakMap();
  function translateDocument(root = document) {
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node=walker.nextNode())) {
      if (node.parentElement?.closest('script,style,[data-native]')) continue;
      const source=sourceTexts.get(node) || reverse.get(node.textContent.trim()) || node.textContent.trim();
      if (!dictionary[source]) continue;
      sourceTexts.set(node,source);
      node.textContent=node.textContent.replace(node.textContent.trim(),t(source));
    }
    for (const element of root.querySelectorAll('[aria-label],[placeholder],[title],[alt],[data-i18n]')) {
      const attrs=sourceAttributes.get(element)||{};
      for(const name of ['aria-label','placeholder','title','alt']) {
        const value=element.getAttribute(name); if(value===null)continue;
        const source=attrs[name] || reverse.get(value) || value;
        if(dictionary[source]) {attrs[name]=source;element.setAttribute(name,t(source));}
      }
      sourceAttributes.set(element,attrs);
      if(element.dataset.i18n)element.textContent=t(element.dataset.i18n);
    }
    document.documentElement.lang=language==='en'?'en':'zh-Hant';
    const selector=document.getElementById('language');if(selector)selector.value=language;
  }
  const wallNames={WALL_ADDED:'Wall added',WALL_REMOVED:'Wall removed',WALL_SHIFTED:'Wall shifted',WALL_THICKNESS_CHANGED:'Wall thickness changed',WALL_OPENING_CHANGED:'Wall opening changed',WALL_EXTENT_CHANGED:'Wall length changed',WALL_BOUNDARY_CHANGED:'Boundary change — verify'};
  function nativeTitle(issue) {
    const value=String(issue.title||issue.id||'');
    return value.replace(/^標註編號：/,'Annotation identifier: ').replace(/^標註移位 · /,'Annotation moved · ').replace(/^標註新增：/,'Annotation added: ').replace(/^標註移除：/,'Annotation removed: ')
      .replace(/^文字移位：/,'Text moved: ').replace(/^文字新增：/,'Text added: ').replace(/^文字移除：/,'Text removed: ').replace(/^數值新增：/,'Numeric annotation added: ').replace(/^數值移除：/,'Numeric annotation removed: ')
      .replace(/^數值：/,'Numeric value: ').replace(/^文字：/,'Text: ').replace(/^Mark新增：/,'Mark added: ').replace(/^Mark移除：/,'Mark removed: ').replace(/：/g,': ').replace(/（/g,' (').replace(/）/g,')');
  }
  function primaryWallDescription(issue) {
    const g=issue.geometric_evidence||{},a=g.old,b=g.new,kind=issue.kind;
    if(kind==='WALL_ADDED')return 'A wall-shaped element with paired boundaries and end evidence appears in the later revision. No corresponding earlier boundary was found here; verify its purpose.';
    if(kind==='WALL_REMOVED')return 'Earlier wall-shaped boundaries are absent at this location in the later revision. Verify removal or a change in drawing convention.';
    if(kind==='WALL_BOUNDARY_CHANGED')return 'Some wall-shaped boundaries changed, but corresponding lines remain in the other revision. This does not confirm an entire wall addition or removal.';
    if(!a||!b)return 'Wall-shaped boundaries changed. Compare the earlier and later geometry and verify the element purpose.';
    const length=runs=>(runs||[]).reduce((s,r)=>s+r[1]-r[0],0),delta=g.length_net_change_paper_pt||0;
    if(kind==='WALL_SHIFTED') {
      const orientation=b.orientation==='H'?'Horizontal':b.orientation==='A'?'Angled':'Vertical';
      const direction=b.orientation==='A'?'in the direction normal to the wall':b.orientation==='H'?(b.center>a.center?'downward':'upward'):(b.center>a.center?'rightward':'leftward');
      let result=orientation+' wall-shaped boundaries shifted '+direction;
      if(g.width_delta_paper_pt>.5)result+=b.thickness>a.thickness?', with increased thickness':', with reduced thickness';
      if(Math.abs(delta)>3)result+=delta>0?', and the wall extent increased':', and the wall extent decreased';
      return result+'. Red shows the earlier boundary; blue shows the later boundary.';
    }
    if(kind==='WALL_THICKNESS_CHANGED')return 'The spacing between wall-shaped boundaries '+(b.thickness>a.thickness?'increased; the inferred wall is thicker.':'decreased; the inferred wall is thinner.');
    if(kind==='WALL_EXTENT_CHANGED')return 'Wall-shaped boundaries '+(length(b.runs)>length(a.runs)?'extend farther':'are shorter')+' at their ends. Check connections with adjacent openings and wall segments.';
    if(kind==='WALL_OPENING_CHANGED')return 'The gap within the wall-shaped boundaries '+(length(b.runs)<length(a.runs)?'increased or was introduced':'decreased or was closed')+'. It is not yet confirmed as a door opening or another type of opening.';
    return 'Wall-shaped boundaries changed; verify their purpose and extent.';
  }
  function wallDescription(issue) {
    const other=(issue.change_types||[]).filter(kind=>kind!==issue.kind&&wallNames[kind]);
    return primaryWallDescription(issue)+(other.length?' Additional detected changes at this location: '+other.map(kind=>wallNames[kind]).join('; ')+'.':'');
  }
  function issueText(issue, field, lang = language) {
    const original=issue[field] || (field==='what_changed'?issue.title:'') || '';
    if(lang!=='en')return original;
    const explicit=issue[field+'_en'] || (field==='what_changed'?issue.title_en:'');
    if(typeof explicit==='string'&&explicit)return explicit;
    if(isModelIssue(issue)) {
      if(original)return t(original,{},'en');
      if(field==='title'||field==='what_changed')return modelKindName(issue.kind);
      if(field==='certainty')return t('元素資料來自模型快照；工程影響仍需覆核。',{},'en');
      return '';
    }
    if(field==='title'||field==='what_changed') {
      if(issue.category==='wall') {
        if(issue.kind==='WALL_SHIFTED'&&issue.geometric_evidence?.width_delta_paper_pt>.5)return 'Wall position and thickness changed';
        return wallNames[issue.kind]||'Wall geometry change';
      }
      if(issue.category==='geometry')return 'Other geometry change · element unconfirmed';
      return t(nativeTitle(issue),{},'en');
    }
    if(field==='description') {
      if(issue.category==='wall')return wallDescription(issue);
      if(issue.category==='geometry') {const e=issue.residual_evidence||{};return (e.added_pixels&&e.removed_pixels?'Added and removed lines':e.added_pixels?'Added lines':'Removed lines')+' are present here. Evidence is insufficient to identify a wall, door or window; the candidate is retained for review.';}
      if(issue.category==='annotation_movement')return 'Text or Mark content is unchanged; only the annotation position changed. This does not imply movement of the physical element.';
      if(issue.kind==='NUMBER_CHANGED')return 'Annotation instance identifiers changed. Check their correspondence with the door/window schedule or element register.';
      if(issue.kind==='MARK_CHANGED')return 'Annotation Mark content changed. Element type and specification require checking against symbols and schedules.';
      if(issue.kind==='ANNOTATION_ADDED'||issue.kind==='ANNOTATION_REMOVED')return 'The annotation was added or removed. This alone does not confirm an addition or removal of the physical door/window.';
      if(issue.kind==='TEXT_ADDED'||issue.kind==='TEXT_REMOVED')return 'This native text group was found only in the '+(issue.kind==='TEXT_ADDED'?'later':'earlier')+' revision. It may have been added, removed or moved elsewhere; physical element additions/removals are unconfirmed.';
      if(issue.confidence!=='high')return 'Nearby text pairing is uncertain. Compare the source details; this is not a confirmed dimension or Mark replacement.';
      if(issue.category==='mark')return 'Native Mark text changed. Verify element type and specification against the drawing legend or schedule.';
      if(issue.category==='dimension')return 'Numeric text changed. Its role as a dimension, level or other numeric annotation is not yet confirmed.';
      return 'Native text content changed. Check the effect on room use, construction notes or drawing instructions.';
    }
    if(field==='ai_observation'||field==='ai_uncertainty')return /[\u3400-\u9fff]/.test(original)?'An unverified local-model observation is retained in the source comparison data.':original;
    const translated=t(original,{},'en');
    if(!/[\u3400-\u9fff]/.test(translated))return translated;
    if(field==='location_hint')return 'Locate on plan';
    if(field==='certainty')return 'Drawing evidence retained; identification and engineering impact require review.';
    if(field==='next_action')return 'Compare the earlier and later details, then retain or ignore the candidate.';
    if(field==='why_it_matters')return 'Verify whether the detected drawing change affects construction or coordination.';
    return original;
  }
  function isModelIssue(issue, data) {return issue?.source_kind==='revit_model'||data?.source_kind==='revit_model';}
  function modelKindName(kind) {
    const names={MODEL_ADDED:'Model element added',MODEL_REMOVED:'Model element removed',MODEL_DELETED:'Model element removed',MODEL_MODIFIED:'Model element modified',MODEL_CHANGED:'Model element changed',MODEL_MOVED:'Model element moved',MODEL_TYPE_CHANGED:'Model type changed',MODEL_PARAMETER_CHANGED:'Model parameter changed',MODEL_GEOMETRY_CHANGED:'Model geometry changed',MODEL_SCOPEENTERED:'Model element entered comparison scope',MODEL_SCOPEEXITED:'Model element left comparison scope'};
    return names[kind]||String(kind||'Model element change').replace(/^MODEL_/,'Model ').replaceAll('_',' ').toLowerCase();
  }
  function modelValue(value) {return value===undefined||value===null?t('未提供'):typeof value==='string'?(value||'""'):typeof value==='object'?JSON.stringify(value):String(value);}
  function modelFieldChanges(evidence) {
    const fields=evidence?.field_changes;
    if(Array.isArray(fields))return fields.filter(v=>v&&typeof v==='object'&&!Array.isArray(v));
    if(fields&&typeof fields==='object')return Object.entries(fields).map(([name,v])=>v&&typeof v==='object'?{name,...v}:{name,new:v});
    return [];
  }
  function modelFieldValue(field, role) {
    const value=Object.prototype.hasOwnProperty.call(field,role)?field[role]:field[role+'_value'];
    const unit=field[role+'_unit']??field.unit;
    return modelValue(value)+(typeof unit==='string'&&unit&&value!==null&&value!==undefined?' '+unit:'');
  }
  function nativeAnnotation(issue) {
    const detail=issue?.native_annotation&&typeof issue.native_annotation==='object'?issue.native_annotation:{};
    return {circle_number:issue?.circle_number??detail.circle_number??issue?.display_number,
      role:issue?.native_annotation_role??detail.role,
      old_status:issue?.old_annotation_status??detail.old_status,
      current_status:issue?.new_annotation_status??issue?.current_annotation_status??detail.new_status??detail.current_status};
  }
  function nativeRole(role, lang=language) {
    const labels={old:'舊區／舊位置',current:'目前區／目前位置',new:'目前區／目前位置',both:'舊區及目前區',unmapped:'未定位'};
    return role===undefined||role===null||role===''?t('未提供',{},lang):t(labels[role]||String(role),{},lang);
  }
  function nativeStatus(status, lang=language, hatchStyle=false) {
    const labels={pending:'圈注待驗證',unverified:'圈注待驗證',requested:'已要求圈注，輸出待驗證',created:'Revit 註記已建立，PDF 輸出待驗證',circle_created:'Revit 註記已建立，PDF 輸出待驗證',placed:'Revit 註記已建立，PDF 輸出待驗證',annotated:'Revit 註記已建立，PDF 輸出待驗證',failed:'圈注未完成／未定位',unmapped:'圈注未完成／未定位',no_circle:'未建立圈注',not_applicable:'不適用',none:'不適用'};
    if(hatchStyle&&status==='no_circle')return t('未建立小標記',{},lang);
    if(hatchStyle&&['failed','unmapped'].includes(status))return t('標記未完成／未定位',{},lang);
    if(hatchStyle&&['pending','unverified'].includes(status))return t('標記待驗證',{},lang);
    return status===undefined||status===null||status===''?t('未提供',{},lang):t(labels[status]||String(status),{},lang);
  }
  global.PCStrings={t,getLanguage,setLanguage,translateDocument,issueText,wallDescription,dictionary,LANGUAGE_KEY,isModelIssue,modelKindName,modelValue,modelFieldChanges,modelFieldValue,nativeAnnotation,nativeRole,nativeStatus};
})(window);
