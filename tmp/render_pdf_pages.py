from pathlib import Path
import fitz

root = Path(__file__).resolve().parents[1]
pdf_path = root / "tmp" / "smartolt-docx-qa" / "SmartOLT_API_Integration_Guide-delivery.pdf"
out_dir = root / "tmp" / "smartolt-docx-qa" / "word-render-delivery"
out_dir.mkdir(parents=True, exist_ok=True)

document = fitz.open(pdf_path)
matrix = fitz.Matrix(1.5, 1.5)
for index, page in enumerate(document):
    pixmap = page.get_pixmap(matrix=matrix, alpha=False)
    pixmap.save(out_dir / f"page-{index + 1:02d}.png")

print(f"Rendered {len(document)} pages to {out_dir}")
