import fitz
import sys
import requests

def inspect_page(pdf_url, page_num):
    print(f"Inspeccionando Página {page_num} de {pdf_url}")
    try:
        res = requests.get(pdf_url)
        res.raise_for_status()
        doc = fitz.open(stream=res.content, filetype="pdf")
        page = doc[page_num - 1]
        dict = page.get_text("dict")
        for b in dict["blocks"]:
            if "lines" in b:
                for l in b["lines"]:
                    line_text = ""
                    for s in l["spans"]:
                        is_bold = s["flags"] & 16
                        marker = "[B]" if is_bold or "bold" in s["font"].lower() else "[ ]"
                        print(f"  {marker} Text: '{s['text']}' | Font: {s['font']} | Flags: {s['flags']} | Size: {s['size']}")
        doc.close()
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    url = "https://ybqzcxabblyzqhezanaf.supabase.co/storage/v1/object/public/cerebro-nutricionista/dietetica-nutricion/alimentacion-equilibrada/UD1.Conceptos basicos"
    inspect_page(url, 2)
