import re

def clean_markdown(text):
    # 1. Quitar todos los espacios tras apertura y antes de cierre
    # (Para normalizar)
    text = re.sub(r'\*\*\s+', '**', text)
    text = re.sub(r'\s+\*\*', '**', text)
    
    # 2. Asegurar espacio ANTES de apertura si no lo hay
    # Apertura = letra + ** + letra
    text = re.sub(r'(\w)\*\*(\w)', r'\1 **\2', text)
    
    # 3. Asegurar espacio DESPUÉS de cierre si no lo hay
    # Cierre = (ya tenemos espacio antes si era apertura)
    # Buscamos letra + ** + letra (que ahora será el cierre)
    text = re.sub(r'(\w)\*\*(\w)', r'\1** \2', text)
    
    return text

# Casos de prueba
tests = [
    "un proceso**voluntario**,**consciente**e**educable**",
    "proceso**voluntario**educable",
]

for t in tests:
    print(f"Original: '{t}'")
    result = clean_markdown(t)
    print(f"Limpio:   '{result}'")
    print("-" * 20)
