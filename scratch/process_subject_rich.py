import os
import fitz # PyMuPDF
from supabase import create_client, Client
from dotenv import load_dotenv
import requests
import sys
import re

load_dotenv()

url: str = os.getenv("PUBLIC_SUPABASE_URL")
key: str = os.getenv("PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def is_bold(span):
    # Detectar por flags (16 = Bold)
    if span["flags"] & 16:
        return True
    # Detectar por nombre de fuente
    font = span["font"].lower()
    if any(x in font for x in ["bold", "negrita", "heavy", "black"]):
        return True
    return False

def process_subject(subject_name):
    print(f"--- Extraccion RICA (Markdown) de asignatura: {subject_name} ---")

    response = supabase.schema("nutricionista").table("documentos").select("*").eq("carpeta", subject_name).execute()
    docs = response.data

    if not docs:
        print("No se encontraron documentos.")
        return

    for doc in docs:
        print(f"Propcesando (Rich MD): {doc['nombre']}...")
        
        try:
            pdf_url = doc["url"]
            pdf_res = requests.get(pdf_url)
            pdf_res.raise_for_status()

            doc_pdf = fitz.open(stream=pdf_res.content, filetype="pdf")
            structured_text = ""
            first_found = False
            
            # Parametros para identificar cabeceras por tamaño
            all_blocks = []
            for page in doc_pdf:
                all_blocks.extend(page.get_text("dict").get("blocks", []))
            
            # Heuristica de tamanno normal
            normal_size = 10
            if all_blocks:
                sizes = [s["size"] for b in all_blocks if b["type"]==0 for l in b["lines"] for s in l["spans"]]
                if sizes:
                    normal_size = max(set(sizes), key=sizes.count)

            is_collecting_index = False

            for b in all_blocks:
                if b["type"] != 0: continue
                for line in b["lines"]:
                    line_text = ""
                    max_size = 0
                    
                    current_bold_segment = ""
                    last_was_bold = False
                    
                    for span in line["spans"]:
                        text = span["text"]
                        if not text.strip():
                            if last_was_bold: current_bold_segment += text
                            else: line_text += text
                            continue
                            
                        span_bold = is_bold(span)
                        max_size = max(max_size, span["size"])
                        
                        if span_bold != last_was_bold:
                            if last_was_bold:
                                clean_text = current_bold_segment.strip()
                                if clean_text:
                                    line_text += f"**{clean_text}**"
                                    if current_bold_segment.endswith(" "): line_text += " "
                                current_bold_segment = ""
                            last_was_bold = span_bold
                        
                        if span_bold:
                            current_bold_segment += text
                        else:
                            line_text += text
                            
                    if last_was_bold:
                        clean_text = current_bold_segment.strip()
                        if clean_text:
                            line_text += f"**{clean_text}**"

                    line_text = line_text.strip()
                    if not line_text: continue

                    is_bullet = re.match(r'^[•\-\*−–—\u2022\u25cf\u25cb\u25aa\u25ab\u2013\u2014\u2212]\s*', line_text)
                    is_numbered = re.match(r'^\(?\d+[\.\)]\s+', line_text)
                    if is_bullet:
                        line_text = re.sub(r'^[•\-\*−–—\u2022\u25cf\u25cb\u25aa\u25ab\u2013\u2014\u2212]\s*', '- ', line_text)
                    
                    if not first_found and any(x in line_text.lower() for x in ["indice", "tabla de", "taboa de"]):
                        is_collecting_index = True
                        first_found = True
                        structured_text += "## Índice\n"
                        continue
                    
                    is_index_bullet = is_collecting_index and (line_text.count(".") > 5 or re.search(r'\d+$', line_text))
                    is_h2 = (max_size > normal_size * 1.3) or (re.search(r'^\d+(\.\d+)*\s+[A-Z]', line_text.replace("*", "")) and max_size > normal_size * 1.1)

                    if is_collecting_index:
                        if is_index_bullet:
                            structured_text += f"{line_text}\n"
                        elif is_h2:
                            is_collecting_index = False
                            structured_text += f"\n\n## {line_text.replace('**','')}\n"
                        else:
                            structured_text += f"{line_text} "
                    else:
                        if is_h2:
                            structured_text += f"\n\n## {line_text.replace('**','')}\n"
                        elif max_size > normal_size * 1.1:
                            structured_text += f"\n\n### {line_text}\n"
                        elif is_bullet or is_numbered:
                            if not structured_text.endswith('\n'):
                                structured_text += "\n"
                            structured_text += f"{line_text}\n"
                        else:
                            if structured_text.endswith('\n'):
                                structured_text += f"{line_text} "
                            else:
                                structured_text += f"{line_text} "

            doc_pdf.close()
            final_content = structured_text.strip()
            
            # --- LIMPIEZA ATOMICA (REGLA DE ORO) ---
            # 1. Eliminar CUALQUIER espacio, tabulación o salto de línea pegado a los asteriscos de negrita (por dentro)
            # El uso de \s+ detecta espacios normales, non-breaking spaces, tabs, etc.
            final_content = re.sub(r'\*\*\s*(.+?)\s*\*\*', r'**\1**', final_content, flags=re.DOTALL)
            
            # --- ESPACIADO EXTERIOR ---
            # 2. Espacio ANTES de apertura: (letra)**word -> (letra) **word
            final_content = re.sub(r'([^\s\n\(\[])\*\*([^\s])', r'\1 **\2', final_content)
            
            # 3. Espacio DESPUES de cierre: word**(letra-no-puntuacion) -> word** (letra)
            # Evitamos poner espacio delante de puntos, comas, etc.
            final_content = re.sub(r'([^\s])\*\*([a-zA-ZáéíóúÁÉÍÓÚñÑ0-9])', r'\1** \2', final_content)

            final_content = final_content.replace('***', '**')
            final_content = final_content.replace('\x00', '')

            supabase.schema("nutricionista").table("documentos").update({"contenido": final_content}).eq("id", doc["id"]).execute()
            print(f"   [OK] Completado ({len(final_content)} chars)")

        except Exception as e:
            print(f"   [ERROR] en {doc['nombre']}: {e}")

if __name__ == "__main__":
    subjects = ["alimentacion-equilibrada", "control-alimentario", "educacion-sanitaria", 
                "fisiopatologia-aplicada-dietetica", "formacion-orientacion-laboral", 
                "organizacion-gestion-gabinete-trabajo", "relaciones-area-trabajo"]
    
    if len(sys.argv) > 1:
        process_subject(sys.argv[1])
    else:
        for s in subjects:
            process_subject(s)
