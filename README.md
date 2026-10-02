# PlanCompare drawing change viewer

This repository contains a public, standalone static viewer for completed drawing comparisons. It does not perform PDF comparisons and has no Ollama, API key, backend, external CDN or cloud model dependency.

## For colleagues

Open the published GitHub Pages address and choose the `.plancompare` review file supplied by your colleague. Browse categorized candidates, click numbered plan circles to inspect evidence, and export selected issues to an English Word report titled **Query of Drawing Differences**. Report information is editable before export. Drawing received dates are displayed as dates only.

Review bundles are read locally in your browser. This website does not upload their content. Original PDFs, project drawings, comparison bundles and example reports are intentionally absent from this repository. Review decisions remain in the user's own browser.

## GitHub Pages deployment

Enable **Settings > Pages > Deploy from a branch**, choose the repository's main branch and the root folder, and save. GitHub supplies the actual published URL after deployment. Publishing is not confirmed merely because these source files exist.

Keep every included HTML and JavaScript file together. `.nojekyll` disables Jekyll processing. No installation or build is required.

For local preview, run a static HTTP server in this folder and open its localhost address. Use HTTP or HTTPS rather than opening `index.html` directly, because the viewer fetches its fixed review template.

## Limits and review status

Only `.plancompare` bundles exported by the comparison application are accepted, up to 350 MiB. The viewer validates the bundle structure, checksums, image headers, sizes and paths before loading. These checks do not confirm engineering conclusions. Detected candidates and their significance require professional review before a report is issued.

## 中文說明

這是供同事閱覽已完成對比的靜態網頁，只接受 `.plancompare` 文件，沒有 PDF 對比功能。可按分類及編號查看證據，選取項目後匯出英文 Word，收到圖紙日期只顯示日期。資料只在各自瀏覽器內讀取，不會上傳到 GitHub。此公開程式碼庫不包含圖紙、對比結果或報告。
