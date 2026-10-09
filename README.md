# PlanCompare drawing and model plan change viewer

This repository contains a public, standalone static viewer for completed drawing comparisons. It does not perform PDF comparisons and has no Ollama, API key, backend, external CDN or cloud model dependency.

This folder is an unpublished local update. The native model workflow is prepared here for later GitHub publication after Revit runtime verification; it has not been deployed by this task.

## For colleagues

Open the published GitHub Pages address and choose the `.plancompare` review file supplied by your colleague. Browse categorized candidates, click numbered plan circles to inspect evidence, and export selected issues to an English Word report titled **Query of Drawing Differences**. Report information is editable before export. Drawing received dates are displayed as dates only.

Review bundles are read locally in your browser. This website does not upload their content. Original PDFs, project drawings, comparison bundles and example reports are intentionally absent from this repository. Review decisions remain in the user's own browser.

## GitHub Pages deployment

Enable **Settings > Pages > Deploy from a branch**, choose the repository's main branch and the root folder, and save. GitHub supplies the actual published URL after deployment. Publishing is not confirmed merely because these source files exist.

Keep every included HTML and JavaScript file together. `.nojekyll` disables Jekyll processing. No installation or build is required.

For local preview, run a static HTTP server in this folder and open its localhost address. Use HTTP or HTTPS rather than opening `index.html` directly, because the viewer fetches its fixed review template.

## Limits and review status

Only `.plancompare` bundles following the review v1 contract are accepted, up to 350 MiB. The viewer validates the bundle structure, checksums, image headers, sizes and paths before loading. These checks do not confirm engineering conclusions. Detected drawing candidates and model differences require professional review before a report is issued.

## Revit model export support

This update retains the PDF comparison viewer and adds a model branch when the manifest data or an issue has `source_kind: "revit_model"`. Model issues can use `wall`, `door`, and `window` categories and `MODEL_*` kind codes. Explicit `title_en`, `description_en`, `what_changed_en`, `certainty_en`, `location_hint_en`, and `next_action_en` take priority over legacy drawing translations.

The intended sequence is model comparison first, native Revit sheet annotations and exports second, and GitHub viewing last. The viewer displays the exported model facts and finalized files; it never detects model changes. A direct `.plancompare` file may retain the original native baseline PDF, current PDF, annotated PDF, native sheet PNG previews, element identifiers, old/new field values, and circle annotation records together.

Each model issue may include `model_evidence` with `unique_id`, `old_element_id`, `new_element_id`, `category_key`, and `field_changes`. Field changes can be an array of `{field, old, new, unit}` records (also supports `name` / `key` and `old_value` / `new_value`), or an object keyed by field name with old/new records. Values and declared units are retained as supplied. The plan detail and exported English Word report display these fields and identifiers. Review decisions remain separate and are not automatically changed to confirmed.

The native route uses `page_background: "native_revit_sheet"`, `display_source: "revit_native_sheet_export"`, and `model_mapping_status: "native_revit_annotations_unverified"`. Revit exports the native PDF and native sheet images separately. The image is not assumed to be a rasterization of the PDF; PDF/image consistency, temporary annotation output and PDF locations require runtime verification. The native branch shows model identifiers and field values before image evidence. It displays source circle numbers, old/current/both/unmapped annotation areas and old/current annotation statuses. An absent `bbox_pt` means PDF location has not been supplied; it does not mean the element is invisible. Only an explicit source `mapping_status: "not_visible"` is displayed as no visible linework.

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

There are at most three PDFs, each at most 120 MiB, with a `%PDF-` header; the overall 350 MiB ZIP limit still applies. The PDFs retain their source bytes. The viewer materializes them as local `application/pdf` Blob URLs and offers a user-clicked **Download annotated PDF** link only when the native annotated PDF exists. No document is uploaded, rewritten or fetched from an external URL. `native_pdf_file` supplies the download filename. The static website repository contains the viewer program; project PDFs remain inside each locally loaded review file.

The earlier `model_mapping_status: "draft_unverified"` branch remains available for captured 2D draft previews and still shows its separate verification warning. A future producer may declare `verified_sheet_pdf` only after performing the corresponding official sheet mapping validation; the viewer does not perform that validation itself.

`bbox_pt` and polygon points, when verified and supplied, use a common paper page, top-left origin, x right and y down, at 1/72 inch per point. Supply all six fixed image names: `old_preview.png`, `old.png`, `aligned_preview.png`, `new_aligned.png`, `overlay_preview.png`, and `overlay.png`, plus each issue's evidence image. Preview and full-resolution framing must match. Native unverified images retain their own aspect ratio and are not used to infer PDF coordinates. The current viewer remains one matched plan page per bundle; embedded PDFs may themselves contain multiple pages. It does not yet have a multi-page image selector.

The root still contains the ten static site files. `verification/` contains local regression tests and is not needed for deployment. These tests exercise legacy ZIP integrity, all 314 issues from the existing PDF reference bundle, localized model descriptions, Word source fields, pending review status, both model-source flag locations, native old/current/both/unmapped annotation states, exact PDF byte retention, document-path/header/size checks, local-only PDF downloads, URL disposal and browser rendering. Run `node --test verification/*.test.cjs`; local baseline and browser-module paths can be overridden with `PLANCOMPARE_BASELINE_DIR`, `PLANCOMPARE_PLAYWRIGHT_MODULE`, and `PLANCOMPARE_BROWSER_CHANNEL`.

## 中文說明

這是供同事閱覽已完成對比的靜態網頁，只接受 `.plancompare` 文件，沒有 PDF 對比功能。可按分類及編號查看證據，選取項目後匯出英文 Word，收到圖紙日期只顯示日期。資料只在各自瀏覽器內讀取，不會上傳到 GitHub。此公開程式碼庫不包含圖紙、對比結果或報告。
