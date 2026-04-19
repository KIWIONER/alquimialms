import os
import fitz # PyMuPDF
from supabase import create_client, Client
from dotenv import load_dotenv
import requests
import sys

load_dotenv()

url: str = os.getenv("PUBLIC_SUPABASE_URL")
key: str = os.getenv("PUBLIC_SUPABASE_ANON_KEY")
supabase: Client = create_client(url, key)

def process_subject(subject_name):
    print(f"--- Procesando asignatura (Python): {subject_name} ---")

    # Consultar documentos
    response = supabase.schema("nutricionista").table("documentos").select("*").eq("carpeta", subject_name).execute()
    docs = response.data

    if not docs:
        print("No se encontraron documentos.")
        return

    print(f"Encontrados {len(docs)} documentos.")

    for doc in docs:
        print(f"Propcesando (doc): {doc['nombre']}...")
        
        try:
            # Descargar PDF
            pdf_url = doc["url"]
            pdf_res = requests.get(pdf_url)
            pdf_res.raise_for_status()

            # Extraer texto con PyMuPDF
            doc_pdf = fitz.open(stream=pdf_res.content, filetype="pdf")
            
            # Lógica de estructuración refinada
            lines = []
            for page in doc_pdf:
                lines.extend([l.strip() for l in page.get_text("text").split('\n') if l.strip()])
            
            structured_text = ""
            current_chunk = ""
            first_found = False

            for line in lines:
                # Detectar Índice primero que nada
                is_indice = not first_found and any(x in line.lower() for x in ["indice", "tabla de contenidos", "taboa de contidos"])
                
                # Detectar otros títulos
                is_title = (line[0].isdigit() if line else False) or \
                           (len(line) < 60 and line.isupper() and len(line) > 4) or \
                           is_indice

                if is_title:
                    if not first_found:
                        structured_text += f"## {line}\n"
                        first_found = True
                    else:
                        structured_text += f"\n\n## {line}\n"
                else:
                    structured_text += f"{line} "

            doc_pdf.close()
            final_content = structured_text.strip()

            # Actualizar DB
            supabase.schema("nutricionista").table("documentos").update({"contenido": final_content}).eq("id", doc["id"]).execute()
            print(f"   [OK] Completado ({len(final_content)} caracteres)")

        except Exception as e:
            print(f"   [ERROR] en {doc['nombre']}: {e}")

if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "alimentacion-equilibrada"
    process_subject(target)
