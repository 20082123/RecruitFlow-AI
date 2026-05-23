# Demo Testing Notes

This document summarizes the manual checks used for the public demo version of RecruitFlow AI.

## Checked Areas

- Local install with `npm install`
- Type checking with `npm run typecheck`
- Production build with `npm run build`
- Linting with `npm run lint`
- Chat import and structured extraction
- Mock extractor fallback without API keys
- Candidate confirmation into the local JSON store
- Candidate search, filtering, editing, deletion, CSV export, and JSON export
- Dashboard metrics, stage distribution, position distribution, and recent updates
- Daily recruiting report generation
- Position normalization, including `AI应用工程师` to `AI 应用工程师`
- Noise handling for non-recruiting chat text

## Known Limitations

- The demo does not connect to real enterprise chat APIs.
- The demo does not connect to real spreadsheet APIs.
- Local JSON storage is not intended for production multi-user concurrency.
- The mock extractor is a fallback for demos; complex extraction should use the LLM mode.
- The app does not make candidate scoring or hiring decisions.