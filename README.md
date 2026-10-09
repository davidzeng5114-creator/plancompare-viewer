# PlanCompare drawing and model plan change viewer

This repository contains a public, standalone static viewer for completed drawing comparisons. It does not perform PDF comparisons and has no Ollama, API key, backend, external CDN or cloud model dependency.

This folder is an unpublished local update prepared for later GitHub publication; it has not been deployed by this task. Project-specific annotation visibility and drawing placement remain review matters for the supplied exports.

## For colleagues

Open the published GitHub Pages address and choose the `.plancompare` review file supplied by your colleague. Browse categorized drawing candidates or exported model values and check numbered native PDF annotations. If the file contains multiple sheets, choose a sheet from the clearly labeled sheet selector. Interactive drawing circles are available only when verified navigation coordinates have been supplied. Report information is editable before English Word export. Drawing received dates are displayed as dates only.

Review bundles are read locally in your browser. This website does not upload their content. Original PDFs, project drawings, comparison bundles and example reports are intentionally absent from this repository. Review decisions remain in the user's own browser.

## GitHub Pages deployment

Enable **Settings > Pages > Deploy from a branch**, choose the repository's main branch and the root folder, and save. GitHub supplies the actual published URL after deployment. Publishing is not confirmed merely because these source files exist.

Keep every included HTML and JavaScript file together. `.nojekyll` disables Jekyll processing. No installation or build is required.

For local preview, run a static HTTP server in this folder and open its localhost address. Use HTTP or HTTPS rather than opening `index.html` directly, because the viewer fetches its fixed review template.

## Limits and review status

Only `.plancompare` bundles following the review v1 contract are accepted, up to 350 MiB. The viewer validates the bundle structure, checksums, image headers, sizes and paths before loading. These checks do not confirm engineering conclusions. Detected drawing candidates and model differences require professional review before a report is issued.

## Revit model export support

This update retains the PDF comparison viewer and adds a model branch when the manifest data or an issue has `source_kind: "revit_model"`. Model issues can use `wall`, `door`, `window`, `floor`, `column` (structural columns), and `beam` (structural framing) categories and `MODEL_*` kind codes. Explicit `title_en`, `description_en`, `what_changed_en`, `certainty_en`, `location_hint_en`, and `next_action_en` take priority over legacy drawing translations.

The intended sequence is model comparison first, native Revit sheet annotations and exports second, and GitHub viewing last. The viewer displays the exported model facts and finalized files; it never detects model changes. A direct `.plancompare` file may retain the original native baseline PDF, current PDF, annotated PDF, native sheet PNG previews, element identifiers, old/new field values, and circle annotation records together.

Each model issue may include `model_evidence` with `unique_id`, `old_element_id`, `new_element_id`, `category_key`, and `field_changes`. Field changes can be an array of `{field, old, new, unit}` records (also supports `name` / `key` and `old_value` / `new_value`), or an object keyed by field name with old/new records. Values and declared units are retained as supplied. The plan detail and exported English Word report display these fields and identifiers. Review decisions remain separate and are not automatically changed to confirmed.

The native route uses `page_background: "native_revit_sheet"`, `display_source: "revit_native_sheet_export"`, and `model_mapping_status: "native_revit_annotations_unverified"`. Revit exports the native PDF and native sheet images separately. The image is not assumed to be a rasterization of the PDF; PDF/image consistency, annotation visibility and drawing locations require project review. The native branch shows model identifiers and field values before image evidence. It displays source circle numbers, old/current/both/unmapped annotation areas and old/current annotation statuses. An absent `bbox_pt` means PDF location has not been supplied; it does not mean the element is invisible. Only an explicit source `mapping_status: "not_visible"` is displayed as no visible linework.

Optional `data.native_background_notes` retains an array of raw source strings for each native sheet. A recorded link state such as `NotFound`, its original file path and the source explanation appear in an initially expanded background-source panel above the plan, including sheets with no model issues. Notes use text-only rendering and remain unchanged when switching language. The current-sheet Word report preserves the exact strings and paths as escaped document text. If a native sheet has no issues but has background-source notes, a Word report can still be exported to retain those records. The viewer does not turn background link states into evidence of main model additions or deletions. Non-native sheets and absent/empty notes add no report content; legacy reports remain unchanged.

Native producers may give `circle_number`, `native_annotation_role`, `old_annotation_status`, and `new_annotation_status` on an issue, or a `native_annotation` object with `circle_number`, `role`, `old_status`, and `new_status`. The native exporter uses `circle_created` (Revit annotation created, PDF output awaits verification) and `no_circle` (no circle annotation created). These describe the exported source status; they do not confirm PDF placement or engineering decisions. Unrecognized statuses are retained as source text. With `native_old_pdf_available: true` and `native_new_pdf_available: true`, the viewer offers baseline, current and annotated native sheet layers; the annotated layer opens first. These correspond to `old*.png`, `new_aligned.png` / `aligned_preview.png`, and `overlay*.png`. The last is an actual annotated native sheet image rather than a generated pixel-difference overlay.

The optional outer manifest `documents` map uses exactly the supported logical names `old.pdf`, `new.pdf`, and `annotated.pdf`, with safe ZIP entries under `documents/`, for example:

```json
{
  "documents": {
    "old.pdf": "documents/old.pdf",
    "new.pdf": "documents/new.pdf",
    "annotated.pdf": "documents/annotated.pdf"
  }
}
```

There are at most three PDFs per sheet, each at most 120 MiB, with a `%PDF-` header; the overall 350 MiB ZIP limit still applies. The PDFs retain their source bytes. The viewer materializes them as local `application/pdf` Blob URLs and offers user-clicked download links for the earlier, current and annotated native PDFs only when each document exists. No document is uploaded, rewritten or fetched from an external URL. `native_pdf_file` supplies the annotated download filename. The static website repository contains the viewer program; project PDFs remain inside each locally loaded review file.

The earlier `model_mapping_status: "draft_unverified"` branch remains available for captured 2D draft previews and still shows its separate verification warning. A future producer may declare `verified_sheet_pdf` only after performing the corresponding official sheet mapping validation; the viewer does not perform that validation itself.

`bbox_pt` and polygon points, when verified and supplied, use a common paper page, top-left origin, x right and y down, at 1/72 inch per point. Supply all six fixed image names: `old_preview.png`, `old.png`, `aligned_preview.png`, `new_aligned.png`, `overlay_preview.png`, and `overlay.png`, plus each issue's evidence image. Preview and full-resolution framing must match. Native unverified images retain their own aspect ratio and are not used to infer PDF coordinates. Each selectable sheet has one matched image canvas; an attached native PDF may itself contain multiple pages, but the viewer does not invent navigation for unverified PDF pages.

## Several sheets in one review file

The optional outer `pages` array holds 1 to 32 sheet records. A file such as GP003–GP010 can hold all eight sheets together. Keep the legacy root `data`, `assets` and `documents` as aliases of the first sheet, and place review statuses for every sheet's globally unique issue ID in the root `reviews` dictionary. A sheet record has this exact shape:

```json
{
  "id": "P01",
  "sheet_number": "GP003",
  "sheet_name": "Ground floor plan",
  "view_name": "Ground floor",
  "data": { "page_size_pt": [841.89, 595.28], "intelligent_review": { "issues": [] } },
  "assets": {
    "old.png": "assets/page01/old.png",
    "old_preview.png": "assets/page01/old_preview.png",
    "new_preview.png": "assets/page01/new_preview.png",
    "new_aligned.png": "assets/page01/new_aligned.png",
    "aligned_preview.png": "assets/page01/aligned_preview.png",
    "overlay.png": "assets/page01/overlay.png",
    "overlay_preview.png": "assets/page01/overlay_preview.png"
  },
  "documents": {
    "old.pdf": "documents/page01/old.pdf",
    "new.pdf": "documents/page01/new.pdf",
    "annotated.pdf": "documents/page01/annotated.pdf"
  }
}
```

This demonstrates the sheet structure; each native sheet's full `data` must also carry the source flags, source fields, native annotation records and actual page measurements described above. Example dimensions are not measurements of a supplied Revit drawing. Every sheet's `data`, image headers, evidence references, document headers and safe paths receive the same validation as a legacy page. Sheet IDs must be distinct, issue IDs must be globally unique across the pages, and asset/document ZIP targets must be distinct between sheets. Repeated logical aliases within one sheet remain supported. Limits remain 350 MiB for the whole file, 6,000 ZIP entries, 32 sheets and 10,000 total sheet issues. The first-page legacy issue IDs must match the first `pages` record. No schema version change is required.

The sheet selector reloads the fixed template with only the selected sheet's images, documents and issues. Its pending, confirmed and ignored review decisions remain separate from other sheets, survive sheet/language switching, and are saved in the user's browser when browser storage is available. Session switching still retains decisions if browser storage cannot be written. Source PDFs are retained unchanged in the original review file; the read-only viewer never reexports or uploads it.

**Word export currently covers only the selected sheet.** The button, export dialog, report cover, each issue and download filename identify the current sheet. Export scope options apply within that sheet. Other sheets are explicitly excluded; a report across all sheets has not been implemented. A whole-file summary is not reused as a sheet-only report summary.

The root still contains the ten static site files. `verification/` contains local regression tests and is not needed for deployment. These tests exercise legacy ZIP integrity, all 314 issues from the existing PDF reference bundle, localized model descriptions, Word source fields, pending review status, both model-source flag locations, native old/current/both/unmapped annotation states, exact PDF byte retention, document-path/header/size checks, local-only PDF downloads, URL disposal and browser rendering. Synthetic GP003–GP010 fixtures exercise all eight sheets, every sheet's three PDF downloads, independent issue lists, review persistence with and without browser writes, all six model categories, current-sheet Word scope, malformed later pages and the 32-sheet limit. The optional C# RootExportSet synthetic fixture also verifies the exact producer contract, including a sheet with no changes. These fixtures do not demonstrate actual Revit execution or drawing output quality. Run `node --test verification/*.test.cjs`; local baseline, browser-module and producer-fixture paths can be overridden with `PLANCOMPARE_BASELINE_DIR`, `PLANCOMPARE_PLAYWRIGHT_MODULE`, `PLANCOMPARE_BROWSER_CHANNEL`, and `PLANCOMPARE_MULTIPAGE_BUNDLE`.

## 中文說明

這是供同事閱覽已匯出圖紙或模型差異的靜態網頁，只接受 `.plancompare` 文件，沒有模型變更判定或 PDF 對比功能。一份文件可包含 GP003–GP010 等多張圖紙；選擇圖紙後查看該頁模型前後值、圈註圖像及原生 PDF。覆核狀態逐頁保留，沒有定位座標時不製造可點選的圈。英文 Word 目前只匯出所選圖紙，報告清楚列出圖紙名稱及範圍。資料只在各自瀏覽器內讀取，不會上傳到 GitHub。此公開程式碼庫不包含圖紙、對比結果或報告。
