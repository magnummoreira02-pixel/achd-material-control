import re

with open(r'C:\Users\mamore\OneDrive - Stine Seed\Área de Trabalho\teste\index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Pattern to find the orphaned layout editor block
pattern = r'        </div>\n                <div style=\{\{ display: "grid", gridTemplateColumns: "minmax\(0, 1\.05fr\) minmax\(330px, \.95fr\)", gap: 18, padding: 18 \}\}>.*?(?=\n        </div>\n      \);)'

new_content = re.sub(pattern, '        </div>', content, flags=re.DOTALL)

with open(r'C:\Users\mamore\OneDrive - Stine Seed\Área de Trabalho\teste\index.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Done')